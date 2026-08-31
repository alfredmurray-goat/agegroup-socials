-- avatar images
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- saved posts
CREATE TABLE public.bookmarks (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, post_id)
);
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bookmarks readable" ON public.bookmarks FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id());
CREATE POLICY "bookmark as self" ON public.bookmarks FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "unbookmark as self" ON public.bookmarks FOR DELETE TO authenticated
  USING (profile_id = public.current_profile_id());

-- in-app notifications (follow, like, comment, follow-back prompts)
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications readable" ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = public.current_profile_id());
CREATE POLICY "notify same band as self" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = public.current_profile_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = notifications.recipient_id AND p.age_band = public.current_band()
    )
  );
CREATE POLICY "mark own notifications read" ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = public.current_profile_id())
  WITH CHECK (recipient_id = public.current_profile_id());
CREATE POLICY "delete own notifications" ON public.notifications FOR DELETE TO authenticated
  USING (recipient_id = public.current_profile_id());

CREATE INDEX notifications_recipient_created_idx ON public.notifications (recipient_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;