ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
CREATE UNIQUE INDEX profiles_riot_id_unique ON public.profiles (riot_id) WHERE riot_id IS NOT NULL;