/**
 * Tipos de retorno para as funções RPC customizadas do Supabase.
 * Estas não são geradas automaticamente pelo CLI — são mantidas aqui manualmente.
 */

export interface ConversationRow {
  id: string;
  user1_id: string;
  user2_id: string;
  match_id: string | null;
  hidden_by: string[] | null;
  created_at: string;
  other_user_id: string;
  other_username: string;
  other_avatar_url: string | null;
  other_riot_id: string | null;
  other_last_seen: string | null;
  other_discord_username: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
}

export interface FriendRow {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend_user_id: string;
  username: string;
  avatar_url: string | null;
  riot_id: string | null;
  last_seen: string | null;
  discord_username: string | null;
  preferred_role: string | null;
  rank_tier: string | null;
  rank_division: string | null;
  rank_source: string | null;
}
