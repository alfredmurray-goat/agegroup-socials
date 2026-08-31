ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS text_scale text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS high_contrast boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bold_text boolean NOT NULL DEFAULT false;