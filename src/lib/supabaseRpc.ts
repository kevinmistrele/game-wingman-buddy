import { supabase } from "@/integrations/supabase/client";
import type { ConversationRow, FriendRow } from "@/types/supabase-rpc";

interface RpcResult<TData> {
  data: TData | null;
  error: unknown;
}

interface CustomRpcClient {
  rpc(functionName: "get_my_conversations"): Promise<RpcResult<ConversationRow[]>>;
  rpc(functionName: "get_my_friends"): Promise<RpcResult<FriendRow[]>>;
}

const customRpcClient = supabase as unknown as CustomRpcClient;

export function getMyConversations() {
  return customRpcClient.rpc("get_my_conversations");
}

export function getMyFriends() {
  return customRpcClient.rpc("get_my_friends");
}
