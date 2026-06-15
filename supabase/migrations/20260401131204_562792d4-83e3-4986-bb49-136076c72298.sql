
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rank_tier text,
  ADD COLUMN IF NOT EXISTS rank_division text DEFAULT 'IV',
  ADD COLUMN IF NOT EXISTS rank_source text DEFAULT 'manual';
