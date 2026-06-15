-- =============================================================================
-- Otimizações de queries — corrige N+1 em conversas e amigos
--
-- Como aplicar:
--   Acesse o painel do Supabase → SQL Editor → cole e execute este arquivo.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. get_my_conversations
--    Retorna todas as conversas visíveis do usuário autenticado, já com
--    o perfil do outro participante e a última mensagem.
--    Substitui o loop N+1 que antes fazia 2 queries por conversa.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_my_conversations()
RETURNS TABLE (
  id               uuid,
  user1_id         uuid,
  user2_id         uuid,
  match_id         uuid,
  hidden_by        uuid[],
  created_at       timestamptz,
  -- perfil do outro participante
  other_user_id    uuid,
  other_username   text,
  other_avatar_url text,
  other_riot_id    text,
  other_last_seen  timestamptz,
  other_discord_username text,
  -- última mensagem
  last_message_content text,
  last_message_at  timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.user1_id,
    c.user2_id,
    c.match_id,
    c.hidden_by,
    c.created_at,
    CASE WHEN c.user1_id = auth.uid() THEN c.user2_id ELSE c.user1_id END AS other_user_id,
    p.username          AS other_username,
    p.avatar_url        AS other_avatar_url,
    p.riot_id           AS other_riot_id,
    p.last_seen         AS other_last_seen,
    p.discord_username  AS other_discord_username,
    m.content           AS last_message_content,
    m.created_at        AS last_message_at
  FROM conversations c
  JOIN profiles p
    ON p.user_id = CASE WHEN c.user1_id = auth.uid() THEN c.user2_id ELSE c.user1_id END
  LEFT JOIN LATERAL (
    SELECT content, created_at
    FROM messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) m ON true
  WHERE
    (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    AND NOT (auth.uid() = ANY(COALESCE(c.hidden_by, '{}')))
  ORDER BY COALESCE(m.created_at, c.created_at) DESC;
$$;

-- Permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION get_my_conversations() TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. get_my_friends
--    Retorna todos os amigos do usuário autenticado com seus perfis.
--    Substitui o loop N+1 que antes fazia 1 query por amizade.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_my_friends()
RETURNS TABLE (
  id               uuid,
  user1_id         uuid,
  user2_id         uuid,
  created_at       timestamptz,
  -- perfil do amigo
  friend_user_id   uuid,
  username         text,
  avatar_url       text,
  riot_id          text,
  last_seen        timestamptz,
  discord_username text,
  preferred_role   text,
  rank_tier        text,
  rank_division    text,
  rank_source      text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id,
    f.user1_id,
    f.user2_id,
    f.created_at,
    CASE WHEN f.user1_id = auth.uid() THEN f.user2_id ELSE f.user1_id END AS friend_user_id,
    p.username,
    p.avatar_url,
    p.riot_id,
    p.last_seen,
    p.discord_username,
    p.preferred_role,
    p.rank_tier,
    p.rank_division,
    p.rank_source
  FROM friendships f
  JOIN profiles p
    ON p.user_id = CASE WHEN f.user1_id = auth.uid() THEN f.user2_id ELSE f.user1_id END
  WHERE f.user1_id = auth.uid() OR f.user2_id = auth.uid()
  ORDER BY f.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_my_friends() TO authenticated;
