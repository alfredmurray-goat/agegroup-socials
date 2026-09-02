-- 1. reliable conversation creation (insert+select raced the rls select policy)
CREATE OR REPLACE FUNCTION public.start_conversation(_other uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid;
  _band public.age_band;
  _conv uuid;
BEGIN
  SELECT id, age_band INTO _me, _band FROM public.profiles WHERE user_id = auth.uid();
  IF _me IS NULL THEN RAISE EXCEPTION 'no profile'; END IF;
  IF _other = _me THEN RAISE EXCEPTION 'cannot chat yourself'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _other) THEN
    RAISE EXCEPTION 'no such profile';
  END IF;

  SELECT c.id INTO _conv
  FROM public.conversations c
  WHERE EXISTS (SELECT 1 FROM public.conversation_members m WHERE m.conversation_id = c.id AND m.profile_id = _me)
    AND EXISTS (SELECT 1 FROM public.conversation_members m WHERE m.conversation_id = c.id AND m.profile_id = _other)
  LIMIT 1;
  IF _conv IS NOT NULL THEN RETURN _conv; END IF;

  IF _band IS NULL THEN
    SELECT age_band INTO _band FROM public.profiles WHERE id = _other;
  END IF;
  IF _band IS NULL THEN _band := 'adult'; END IF;

  INSERT INTO public.conversations (age_band) VALUES (_band) RETURNING id INTO _conv;
  INSERT INTO public.conversation_members (conversation_id, profile_id)
  VALUES (_conv, _me), (_conv, _other);
  RETURN _conv;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_conversation(uuid) TO authenticated;

-- 2. admins can review every band (needed for the admin dashboard / both feeds)
DROP POLICY IF EXISTS "admins read all posts" ON public.posts;
CREATE POLICY "admins read all posts" ON public.posts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins read all comments" ON public.post_comments;
CREATE POLICY "admins read all comments" ON public.post_comments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins read all likes" ON public.post_likes;
CREATE POLICY "admins read all likes" ON public.post_likes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins read all follows" ON public.follows;
CREATE POLICY "admins read all follows" ON public.follows
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins delete any profile" ON public.profiles;
CREATE POLICY "admins delete any profile" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. make sure the owner account holds the admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'alfredcasper1010@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;