
-- Allow users to delete their own conversations
CREATE POLICY "Users can delete their conversations"
ON public.conversations
FOR DELETE
TO authenticated
USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));

-- Allow users to delete messages in their conversations
CREATE POLICY "Users can delete messages in their conversations"
ON public.messages
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id = messages.conversation_id
  AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
));

-- Function to delete a user's account and all related data
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  -- Delete messages sent by user
  DELETE FROM public.messages WHERE sender_id = _uid;
  -- Delete conversations
  DELETE FROM public.conversations WHERE user1_id = _uid OR user2_id = _uid;
  -- Delete friendships
  DELETE FROM public.friendships WHERE user1_id = _uid OR user2_id = _uid;
  -- Delete matches
  DELETE FROM public.matches WHERE user1_id = _uid OR user2_id = _uid;
  -- Delete matchmaking queue entries
  DELETE FROM public.matchmaking_queue WHERE user_id = _uid;
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = _uid;
  -- Delete profile
  DELETE FROM public.profiles WHERE user_id = _uid;
  -- Delete auth user (this triggers cascade)
  DELETE FROM auth.users WHERE id = _uid;
END;
$$;
