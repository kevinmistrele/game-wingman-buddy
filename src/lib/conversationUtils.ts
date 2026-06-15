import { supabase } from "@/integrations/supabase/client";

export async function findOrCreateConversation(
  userId: string,
  user1Id: string,
  user2Id: string,
  matchId?: string,
): Promise<string | null> {
  const [id1, id2] = [user1Id, user2Id].sort();

  const unhide = async (convoId: string) => {
    const { data: convo } = await supabase
      .from("conversations")
      .select("hidden_by")
      .eq("id", convoId)
      .single();
    if (!convo) return;
    const hiddenBy: string[] = convo.hidden_by ?? [];
    if (hiddenBy.includes(userId)) {
      await supabase
        .from("conversations")
        .update({ hidden_by: hiddenBy.filter(uid => uid !== userId) })
        .eq("id", convoId);
    }
  };

  // Try to find existing conversation (with retries for race conditions)
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("user1_id", id1)
      .eq("user2_id", id2)
      .limit(1)
      .single();

    if (existing) {
      await unhide(existing.id);
      return existing.id;
    }

    if (attempt < 2) await new Promise(r => setTimeout(r, 400));
  }

  // Create new conversation
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user1_id: id1, user2_id: id2, ...(matchId ? { match_id: matchId } : {}) })
    .select("id")
    .single();

  if (created) return created.id;

  // Insert failed (unique constraint race) — retry lookup
  if (error) {
    for (let attempt = 0; attempt < 4; attempt++) {
      await new Promise(r => setTimeout(r, 300));
      const { data: retry } = await supabase
        .from("conversations")
        .select("id")
        .eq("user1_id", id1)
        .eq("user2_id", id2)
        .limit(1)
        .single();
      if (retry) {
        await unhide(retry.id);
        return retry.id;
      }
    }
  }

  return null;
}

export async function fetchExcludedUserIds(userId: string): Promise<Set<string>> {
  const excluded = new Set<string>();

  const [{ data: friendships }, { data: blockedUsers }] = await Promise.all([
    supabase.from("friendships").select("user1_id, user2_id").or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
    supabase.from("blocked_users").select("blocker_id, blocked_id").or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
  ]);

  friendships?.forEach(f => excluded.add(f.user1_id === userId ? f.user2_id : f.user1_id));
  blockedUsers?.forEach(b => excluded.add(b.blocker_id === userId ? b.blocked_id : b.blocker_id));

  return excluded;
}
