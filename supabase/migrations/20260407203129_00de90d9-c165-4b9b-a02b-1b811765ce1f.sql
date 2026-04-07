ALTER TABLE public.matchmaking_queue
  ADD COLUMN my_role text DEFAULT NULL
    CHECK (my_role IN ('top','jungle','mid','adc','support') OR my_role IS NULL),
  ADD COLUMN desired_duo_role text DEFAULT NULL
    CHECK (desired_duo_role IN ('top','jungle','mid','adc','support') OR desired_duo_role IS NULL);