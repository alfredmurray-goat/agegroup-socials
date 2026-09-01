-- add source_post_id to support reposts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS source_post_id uuid REFERENCES public.posts(id);
