ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_group boolean NOT NULL DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_year integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS claimed_band public.age_band;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at timestamptz;
ALTER TABLE public.profiles ALTER COLUMN theme SET DEFAULT 'light';

CREATE OR REPLACE FUNCTION public.start_group(_title text, _members uuid[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid; _band public.age_band; _conv uuid; _m uuid;
BEGIN
  SELECT id, age_band INTO _me, _band FROM public.profiles
   WHERE user_id = auth.uid() AND verification_status = 'verified';
  IF _me IS NULL OR _band IS NULL THEN RAISE EXCEPTION 'not verified'; END IF;
  IF coalesce(array_length(_members,1),0) < 2 THEN RAISE EXCEPTION 'pick at least 2 people'; END IF;
  IF array_length(_members,1) > 30 THEN RAISE EXCEPTION 'too many people'; END IF;
  IF length(trim(coalesce(_title,''))) = 0 OR length(_title) > 60 THEN RAISE EXCEPTION 'bad group name'; END IF;
  FOREACH _m IN ARRAY _members LOOP
    IF _m = _me THEN CONTINUE; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _m AND p.age_band = _band) THEN
      RAISE EXCEPTION 'everyone must be in your age band';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = _me AND f.following_id = _m) THEN
      RAISE EXCEPTION 'you can only add people you follow';
    END IF;
    IF EXISTS (SELECT 1 FROM public.blocks b WHERE (b.blocker_id = _m AND b.blocked_id = _me) OR (b.blocker_id = _me AND b.blocked_id = _m)) THEN
      RAISE EXCEPTION 'someone in that list is blocked';
    END IF;
  END LOOP;
  INSERT INTO public.conversations (age_band, is_group, title) VALUES (_band, true, trim(_title)) RETURNING id INTO _conv;
  INSERT INTO public.conversation_members (conversation_id, profile_id) VALUES (_conv, _me);
  INSERT INTO public.conversation_members (conversation_id, profile_id)
    SELECT DISTINCT _conv, x FROM unnest(_members) x WHERE x <> _me;
  RETURN _conv;
END; $$;
REVOKE ALL ON FUNCTION public.start_group(text, uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.start_group(text, uuid[]) TO authenticated;

-- 1:1 lookup must ignore groups
CREATE OR REPLACE FUNCTION public.start_conversation(_other uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _me uuid; _band public.age_band; _conv uuid;
BEGIN
  SELECT id, age_band INTO _me, _band FROM public.profiles WHERE user_id = auth.uid();
  IF _me IS NULL THEN RAISE EXCEPTION 'no profile'; END IF;
  IF _other = _me THEN RAISE EXCEPTION 'cannot chat yourself'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _other AND age_band IS NOT DISTINCT FROM _band) THEN
    RAISE EXCEPTION 'no such profile';
  END IF;
  SELECT c.id INTO _conv FROM public.conversations c
  WHERE c.is_group = false
    AND EXISTS (SELECT 1 FROM public.conversation_members m WHERE m.conversation_id = c.id AND m.profile_id = _me)
    AND EXISTS (SELECT 1 FROM public.conversation_members m WHERE m.conversation_id = c.id AND m.profile_id = _other)
  LIMIT 1;
  IF _conv IS NOT NULL THEN RETURN _conv; END IF;
  IF _band IS NULL THEN _band := 'under_18'; END IF;
  INSERT INTO public.conversations (age_band) VALUES (_band) RETURNING id INTO _conv;
  INSERT INTO public.conversation_members (conversation_id, profile_id) VALUES (_conv, _me), (_conv, _other);
  RETURN _conv;
END; $function$;

-- admin reads/updates
DROP POLICY IF EXISTS "admins read all profiles" ON public.profiles;
CREATE POLICY "admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins update profiles" ON public.profiles;
CREATE POLICY "admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins read reports" ON public.reports;
CREATE POLICY "admins read reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins update reports" ON public.reports;
CREATE POLICY "admins update reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins delete posts" ON public.posts;
CREATE POLICY "admins delete posts" ON public.posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins delete comments" ON public.post_comments;
CREATE POLICY "admins delete comments" ON public.post_comments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));