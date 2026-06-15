
-- 1. UPDATE policy on conversations
CREATE POLICY "Participants can update their conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id))
WITH CHECK ((auth.uid() = user1_id) OR (auth.uid() = user2_id));

-- 2. friend_requests table
CREATE TABLE public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender can insert friend requests"
ON public.friend_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their friend requests"
ON public.friend_requests FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Receiver can update friend requests"
ON public.friend_requests FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their friend requests"
ON public.friend_requests FOR DELETE TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Enable realtime for friend_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;

-- 3. blocked_users table
CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert blocks"
ON public.blocked_users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view their blocks"
ON public.blocked_users FOR SELECT TO authenticated
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their blocks"
ON public.blocked_users FOR DELETE TO authenticated
USING (auth.uid() = blocker_id);
