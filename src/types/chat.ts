import type { Tables } from "@/integrations/supabase/types";

export type Message = Tables<"messages">;
export type Conversation = Tables<"conversations">;
export type Friendship = Tables<"friendships">;
export type Profile = Tables<"profiles">;

export interface ConversationWithProfile extends Conversation {
  otherProfile: Profile | null;
  lastMessage?: Message | null;
}

export interface FriendWithProfile extends Friendship {
  profile: Profile | null;
}
