
-- Add column to track which user(s) hid a conversation
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS hidden_by uuid[] DEFAULT '{}';
