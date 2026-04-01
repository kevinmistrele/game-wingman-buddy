-- Fix overly permissive INSERT policy on matches
DROP POLICY "Authenticated users can create matches" ON public.matches;
CREATE POLICY "Participants can create matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);