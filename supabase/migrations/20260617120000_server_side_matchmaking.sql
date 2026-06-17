-- ─────────────────────────────────────────────────────────────────────────────
-- Server-side matchmaking: move rank validation and match creation off the
-- browser and into a SECURITY DEFINER Postgres function + AFTER INSERT trigger.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Store rank snapshot on queue entry so matching never needs an API call
ALTER TABLE public.matchmaking_queue
  ADD COLUMN IF NOT EXISTS rank_tier      TEXT,
  ADD COLUMN IF NOT EXISTS rank_division  TEXT;

-- 2. Tier/division helpers (used inside the matching function)
CREATE OR REPLACE FUNCTION public.get_tier_index(tier TEXT)
RETURNS INTEGER LANGUAGE SQL IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE tier
    WHEN 'IRON'        THEN 0
    WHEN 'BRONZE'      THEN 1
    WHEN 'SILVER'      THEN 2
    WHEN 'GOLD'        THEN 3
    WHEN 'PLATINUM'    THEN 4
    WHEN 'EMERALD'     THEN 5
    WHEN 'DIAMOND'     THEN 6
    WHEN 'MASTER'      THEN 7
    WHEN 'GRANDMASTER' THEN 8
    WHEN 'CHALLENGER'  THEN 9
    ELSE 0
  END
$$;

CREATE OR REPLACE FUNCTION public.get_division_index(division TEXT)
RETURNS INTEGER LANGUAGE SQL IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE division
    WHEN 'IV'  THEN 0
    WHEN 'III' THEN 1
    WHEN 'II'  THEN 2
    WHEN 'I'   THEN 3
    ELSE 0
  END
$$;

-- 3. Rank compatibility: mirrors Riot's official Solo/Duo restrictions
CREATE OR REPLACE FUNCTION public.can_match_solo_duo(
  tier1 TEXT, div1 TEXT, tier2 TEXT, div2 TEXT
) RETURNS BOOLEAN LANGUAGE SQL IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE
    WHEN tier1 IN ('MASTER','GRANDMASTER','CHALLENGER')
      OR tier2 IN ('MASTER','GRANDMASTER','CHALLENGER') THEN FALSE
    WHEN tier1 = 'DIAMOND' AND tier2 = 'DIAMOND' THEN
      ABS(get_division_index(div1) - get_division_index(div2)) <= 2
    WHEN tier1 = 'DIAMOND' OR tier2 = 'DIAMOND' THEN FALSE
    ELSE ABS(get_tier_index(tier1) - get_tier_index(tier2)) <= 1
  END
$$;

-- 4. Role preference compatibility check
CREATE OR REPLACE FUNCTION public.are_roles_compatible(
  my_role1     TEXT, desired_role1 TEXT,
  my_role2     TEXT, desired_role2 TEXT
) RETURNS BOOLEAN LANGUAGE SQL IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE
    -- Both play the same role and at least one specified a desired duo role
    WHEN my_role1 IS NOT NULL AND my_role2 IS NOT NULL
      AND my_role1 = my_role2
      AND (desired_role1 IS NOT NULL OR desired_role2 IS NOT NULL) THEN FALSE
    -- Player 1 wants a specific duo role that player 2 doesn't fill
    WHEN desired_role1 IS NOT NULL
      AND (my_role2 IS NULL OR my_role2 <> desired_role1) THEN FALSE
    -- Player 2 wants a specific duo role that player 1 doesn't fill
    WHEN desired_role2 IS NOT NULL
      AND (my_role1 IS NULL OR my_role1 <> desired_role2) THEN FALSE
    ELSE TRUE
  END
$$;

-- 5. Core server-side matching function
--    Runs with superuser privileges (SECURITY DEFINER) to bypass RLS and use
--    SELECT … FOR UPDATE SKIP LOCKED for race-free match creation.
CREATE OR REPLACE FUNCTION public.attempt_matchmaking(p_entry_id UUID)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_entry    matchmaking_queue%ROWTYPE;
  v_opp      matchmaking_queue%ROWTYPE;
  v_match_id UUID;
  v_ranked   BOOLEAN;
  v_phase    TEXT;
BEGIN
  -- Lock our own entry; if already locked or not waiting, bail immediately
  SELECT * INTO v_entry
  FROM matchmaking_queue
  WHERE id = p_entry_id AND status = 'waiting'
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN RETURN NULL; END IF;

  v_ranked := v_entry.mode IN ('solo_duo', 'flex');

  FOR v_opp IN
    SELECT q.*
    FROM matchmaking_queue q
    WHERE q.status    = 'waiting'
      AND q.id       <> p_entry_id
      AND q.game      = v_entry.game
      AND q.mode      = v_entry.mode
      AND q.user_id  <> v_entry.user_id
      AND q.created_at >= NOW() - INTERVAL '2 minutes'
      -- Exclude friends
      AND q.user_id NOT IN (
        SELECT CASE WHEN f.user1_id = v_entry.user_id THEN f.user2_id ELSE f.user1_id END
        FROM friendships f
        WHERE f.user1_id = v_entry.user_id OR f.user2_id = v_entry.user_id
      )
      -- Exclude blocked users (both directions)
      AND q.user_id NOT IN (
        SELECT CASE WHEN b.blocker_id = v_entry.user_id THEN b.blocked_id ELSE b.blocker_id END
        FROM blocked_users b
        WHERE b.blocker_id = v_entry.user_id OR b.blocked_id = v_entry.user_id
      )
    ORDER BY q.created_at ASC
    LIMIT 20
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Expanded phase if either player waited over 30 s (loosen role restrictions)
    v_phase := CASE
      WHEN (NOW() - v_entry.created_at) > INTERVAL '30 seconds'
        OR  (NOW() - v_opp.created_at)  > INTERVAL '30 seconds'
      THEN 'expanded'
      ELSE 'strict'
    END;

    -- Rank compatibility (ranked modes only)
    IF v_ranked THEN
      IF v_entry.rank_tier IS NULL OR v_opp.rank_tier IS NULL THEN CONTINUE; END IF;

      IF v_entry.mode = 'solo_duo' THEN
        IF NOT can_match_solo_duo(
          v_entry.rank_tier, COALESCE(v_entry.rank_division, 'IV'),
          v_opp.rank_tier,   COALESCE(v_opp.rank_division,   'IV')
        ) THEN CONTINUE; END IF;

      ELSIF v_entry.mode = 'flex' THEN
        IF ABS(get_tier_index(v_entry.rank_tier) - get_tier_index(v_opp.rank_tier)) > 2 THEN
          CONTINUE;
        END IF;
      END IF;
    END IF;

    -- Role compatibility (strict phase + ranked only)
    IF v_phase = 'strict' AND v_ranked THEN
      IF NOT are_roles_compatible(
        v_entry.my_role, v_entry.desired_duo_role,
        v_opp.my_role,   v_opp.desired_duo_role
      ) THEN CONTINUE; END IF;
    END IF;

    -- Create the match atomically
    INSERT INTO matches (user1_id, user2_id, game)
    VALUES (v_entry.user_id, v_opp.user_id, v_entry.game)
    RETURNING id INTO v_match_id;

    UPDATE matchmaking_queue SET status = 'matched'
    WHERE id IN (p_entry_id, v_opp.id);

    RETURN v_match_id;
  END LOOP;

  RETURN NULL;
END;
$$;

-- 6. Trigger wrapper: auto-attempt matching whenever a new queue entry is inserted
CREATE OR REPLACE FUNCTION public.trigger_attempt_matchmaking()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM attempt_matchmaking(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_queue_entry_insert ON public.matchmaking_queue;
CREATE TRIGGER on_queue_entry_insert
AFTER INSERT ON public.matchmaking_queue
FOR EACH ROW EXECUTE FUNCTION public.trigger_attempt_matchmaking();

-- 7. Tighten RLS on matches
--    Remove the open "any authenticated user can insert any match" policy.
--    Match creation now happens exclusively in the SECURITY DEFINER function.
DROP POLICY IF EXISTS "Authenticated users can create matches" ON public.matches;

--    Clients may still read and respond to their own matches via the edge
--    function, but the old unrestricted UPDATE is replaced here for safety.
DROP POLICY IF EXISTS "Users can update their matches" ON public.matches;
CREATE POLICY "Users can update own match fields" ON public.matches
FOR UPDATE TO authenticated
USING  (auth.uid() = user1_id OR auth.uid() = user2_id)
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 8. Tighten queue UPDATE: clients may only cancel their own entries
DROP POLICY IF EXISTS "Users can update own queue entry" ON public.matchmaking_queue;
CREATE POLICY "Users can cancel own queue entry" ON public.matchmaking_queue
FOR UPDATE TO authenticated
USING  (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status = 'cancelled');
