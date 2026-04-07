ALTER TABLE public.profiles
  ADD COLUMN preferred_role text DEFAULT NULL
    CHECK (preferred_role IN ('top','jungle','mid','adc','support') OR preferred_role IS NULL),
  ADD COLUMN preferred_duo_role text DEFAULT NULL
    CHECK (preferred_duo_role IN ('top','jungle','mid','adc','support') OR preferred_duo_role IS NULL);