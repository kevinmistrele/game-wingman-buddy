import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const GAME = "lol";
const HIGH_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

  // User-scoped client to validate the JWT (respects RLS)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  // Service client for privileged DB operations (bypasses RLS)
  const db = createClient(supabaseUrl, serviceKey);

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { action } = body;

  // ── JOIN ──────────────────────────────────────────────────────────────────
  if (action === "join") {
    const mode          = body.mode as string | undefined;
    const myRole        = (body.myRole        ?? null) as string | null;
    const desiredDuoRole = (body.desiredDuoRole ?? null) as string | null;

    if (!mode) return json({ error: "mode required" }, 400);

    const isRanked = mode === "solo_duo" || mode === "flex";

    const { data: profile } = await db
      .from("profiles")
      .select("rank_tier, rank_division")
      .eq("user_id", user.id)
      .single();

    const rankTier     = profile?.rank_tier     ?? null;
    const rankDivision = profile?.rank_division ?? null;

    if (isRanked) {
      if (!rankTier) {
        return json({ error: "Você precisa ter um rank para entrar em filas ranqueadas." }, 400);
      }
      if (mode === "solo_duo" && HIGH_TIERS.has(rankTier)) {
        return json({ error: "Mestre, Grão-Mestre e Desafiante não podem jogar Solo/Duo." }, 400);
      }
    }

    const roleToSave    = isRanked ? myRole         : null;
    const desiredToSave = isRanked ? desiredDuoRole : null;

    const { data: entry, error: insertError } = await db
      .from("matchmaking_queue")
      .insert({
        user_id:         user.id,
        game:            GAME,
        status:          "waiting",
        mode,
        my_role:         roleToSave,
        desired_duo_role: desiredToSave,
        rank_tier:        isRanked ? rankTier     : null,
        rank_division:    isRanked ? rankDivision : null,
      })
      .select("id")
      .single();

    if (insertError || !entry) {
      return json({ error: "Erro ao entrar na fila." }, 500);
    }

    return json({ queueEntryId: entry.id });
  }

  // ── CANCEL ────────────────────────────────────────────────────────────────
  if (action === "cancel") {
    const queueEntryId = body.queueEntryId as string | undefined;
    if (!queueEntryId) return json({ error: "queueEntryId required" }, 400);

    await db
      .from("matchmaking_queue")
      .update({ status: "cancelled" })
      .eq("id", queueEntryId)
      .eq("user_id", user.id);

    return json({ success: true });
  }

  // ── RETRY (expanded-phase trigger) ────────────────────────────────────────
  if (action === "retry") {
    const queueEntryId = body.queueEntryId as string | undefined;
    if (!queueEntryId) return json({ error: "queueEntryId required" }, 400);

    // Verify ownership and that the entry is still waiting
    const { data: entry } = await db
      .from("matchmaking_queue")
      .select("id, status")
      .eq("id", queueEntryId)
      .eq("user_id", user.id)
      .single();

    if (!entry || entry.status !== "waiting") return json({ matchId: null });

    const { data: matchId } = await db.rpc("attempt_matchmaking", {
      p_entry_id: queueEntryId,
    });

    return json({ matchId: matchId ?? null });
  }

  // ── RESPOND (accept / decline) ────────────────────────────────────────────
  if (action === "respond") {
    const matchId  = body.matchId  as string  | undefined;
    const accepted = body.accepted as boolean | undefined;

    if (!matchId) return json({ error: "matchId required" }, 400);
    if (accepted === undefined) return json({ error: "accepted required" }, 400);

    const { data: match } = await db
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (!match) return json({ error: "Match not found" }, 404);
    if (match.user1_id !== user.id && match.user2_id !== user.id) {
      return json({ error: "Forbidden" }, 403);
    }

    const isUser1        = match.user1_id === user.id;
    const myStatusField  = isUser1 ? "user1_status" : "user2_status";

    if (!accepted) {
      await db.from("matches").update({
        [myStatusField]: "declined",
        status: "declined",
      }).eq("id", matchId);

      return json({ success: true });
    }

    await db.from("matches").update({ [myStatusField]: "accepted" }).eq("id", matchId);

    const { data: fresh } = await db.from("matches").select("*").eq("id", matchId).single();
    if (!fresh) return json({ error: "Match not found after update" }, 500);

    const bothAccepted =
      fresh.user1_status === "accepted" && fresh.user2_status === "accepted";

    if (!bothAccepted) return json({ success: true, conversationId: null });

    if (fresh.status !== "accepted") {
      await db.from("matches").update({ status: "accepted" }).eq("id", matchId);
    }

    const conversationId = await findOrCreateConversation(
      db, fresh.user1_id, fresh.user2_id, matchId,
    );

    return json({ success: true, conversationId });
  }

  return json({ error: "Invalid action" }, 400);
});

// deno-lint-ignore no-explicit-any
async function findOrCreateConversation(
  db: ReturnType<typeof createClient>,
  user1Id: string,
  user2Id: string,
  matchId: string,
): Promise<string | null> {
  const [id1, id2] = [user1Id, user2Id].sort();

  const { data: existing } = await db
    .from("conversations")
    .select("id")
    .eq("user1_id", id1)
    .eq("user2_id", id2)
    .limit(1)
    .single();

  if (existing) return existing.id;

  const { data: created, error } = await db
    .from("conversations")
    .insert({ user1_id: id1, user2_id: id2, match_id: matchId })
    .select("id")
    .single();

  if (created) return created.id;

  // Unique-constraint race: retry lookup
  if (error) {
    await new Promise((r) => setTimeout(r, 200));
    const { data: retry } = await db
      .from("conversations")
      .select("id")
      .eq("user1_id", id1)
      .eq("user2_id", id2)
      .limit(1)
      .single();
    if (retry) return retry.id;
  }

  return null;
}
