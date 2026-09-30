CREATE TABLE public.post_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  topic text,
  kind text NOT NULL DEFAULT 'post' CHECK (kind IN ('post', 'video')),
  edit_document jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_path text,
  source_paths text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_drafts TO authenticated;
GRANT ALL ON public.post_drafts TO service_role;
ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners read post drafts" ON public.post_drafts FOR SELECT TO authenticated USING (author_id = public.current_profile_id());
CREATE POLICY "owners create post drafts" ON public.post_drafts FOR INSERT TO authenticated WITH CHECK (author_id = public.current_profile_id());
CREATE POLICY "owners update post drafts" ON public.post_drafts FOR UPDATE TO authenticated USING (author_id = public.current_profile_id()) WITH CHECK (author_id = public.current_profile_id());
CREATE POLICY "owners delete post drafts" ON public.post_drafts FOR DELETE TO authenticated USING (author_id = public.current_profile_id());
CREATE INDEX post_drafts_author_updated_idx ON public.post_drafts(author_id, updated_at DESC);

CREATE TABLE public.music_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  artist text NOT NULL,
  storage_path text,
  public_url text,
  duration_seconds numeric(10,2),
  license_name text NOT NULL,
  license_url text,
  is_catalog boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT music_track_source CHECK (storage_path IS NOT NULL OR public_url IS NOT NULL),
  CONSTRAINT music_track_owner CHECK ((is_catalog AND owner_id IS NULL) OR (NOT is_catalog AND owner_id IS NOT NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.music_tracks TO authenticated;
GRANT ALL ON public.music_tracks TO service_role;
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read available music" ON public.music_tracks FOR SELECT TO authenticated USING (is_catalog OR owner_id = public.current_profile_id());
CREATE POLICY "owners create personal music" ON public.music_tracks FOR INSERT TO authenticated WITH CHECK (owner_id = public.current_profile_id() AND NOT is_catalog);
CREATE POLICY "owners update personal music" ON public.music_tracks FOR UPDATE TO authenticated USING (owner_id = public.current_profile_id() AND NOT is_catalog) WITH CHECK (owner_id = public.current_profile_id() AND NOT is_catalog);
CREATE POLICY "owners delete personal music" ON public.music_tracks FOR DELETE TO authenticated USING (owner_id = public.current_profile_id() AND NOT is_catalog);
CREATE INDEX music_tracks_owner_idx ON public.music_tracks(owner_id, created_at DESC);

CREATE TABLE public.post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  media_kind text NOT NULL CHECK (media_kind IN ('image', 'video')),
  sort_order integer NOT NULL DEFAULT 0,
  width integer,
  height integer,
  duration_seconds numeric(10,2),
  edit_manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, sort_order)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_media TO authenticated;
GRANT ALL ON public.post_media TO service_role;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "same band post media readable" ON public.post_media FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.age_band = public.current_band()));
CREATE POLICY "owners create post media" ON public.post_media FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.current_profile_id()));
CREATE POLICY "owners update post media" ON public.post_media FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.current_profile_id())) WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.current_profile_id()));
CREATE POLICY "owners delete post media" ON public.post_media FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.current_profile_id()));
CREATE INDEX post_media_post_order_idx ON public.post_media(post_id, sort_order);

ALTER TABLE public.posts ADD COLUMN music_track_id uuid REFERENCES public.music_tracks(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN song_title text;
ALTER TABLE public.posts ADD COLUMN song_artist text;
ALTER TABLE public.posts ADD COLUMN audio_path text;
ALTER TABLE public.posts ADD COLUMN cover_path text;
ALTER TABLE public.posts ADD COLUMN edit_manifest jsonb NOT NULL DEFAULT '{}'::jsonb;