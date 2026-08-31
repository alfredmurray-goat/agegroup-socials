ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_dms text NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS allow_comments text NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS hide_from_search boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS reduce_motion boolean NOT NULL DEFAULT false;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'lowkey';

CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own blocks readable" ON public.blocks;
CREATE POLICY "own blocks readable" ON public.blocks
  FOR SELECT TO authenticated USING (blocker_id = public.current_profile_id());

DROP POLICY IF EXISTS "block as self" ON public.blocks;
CREATE POLICY "block as self" ON public.blocks
  FOR INSERT TO authenticated WITH CHECK (blocker_id = public.current_profile_id());

DROP POLICY IF EXISTS "unblock as self" ON public.blocks;
CREATE POLICY "unblock as self" ON public.blocks
  FOR DELETE TO authenticated USING (blocker_id = public.current_profile_id());