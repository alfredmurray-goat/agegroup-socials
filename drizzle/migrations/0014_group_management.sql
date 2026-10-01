ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT public.current_profile_id();
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS emoji text;

CREATE OR REPLACE FUNCTION public.add_group_members(_conv uuid, _members uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid := public.current_profile_id(); _band public.age_band; _m uuid; _count int;
BEGIN
  SELECT age_band INTO _band FROM public.conversations WHERE id = _conv AND is_group;
  IF _band IS NULL THEN RAISE EXCEPTION 'group not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = _conv AND profile_id = _me) THEN RAISE EXCEPTION 'not in this group'; END IF;
  SELECT count(*) INTO _count FROM public.conversation_members WHERE conversation_id = _conv;
  IF _count + coalesce(array_length(_members,1),0) > 30 THEN RAISE EXCEPTION 'groups max out at 30 people'; END IF;
  FOREACH _m IN ARRAY _members LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _m AND p.age_band = _band AND p.banned_at IS NULL) THEN RAISE EXCEPTION 'everyone must be in your age band'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = _me AND f.following_id = _m) THEN RAISE EXCEPTION 'you can only add people you follow'; END IF;
    IF EXISTS (SELECT 1 FROM public.blocks b WHERE (b.blocker_id = _m AND b.blocked_id = _me) OR (b.blocker_id = _me AND b.blocked_id = _m)) THEN RAISE EXCEPTION 'someone in that list is blocked'; END IF;
    INSERT INTO public.conversation_members (conversation_id, profile_id) VALUES (_conv, _m) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.update_group(_conv uuid, _title text, _emoji text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.conversation_members m JOIN public.conversations c ON c.id = m.conversation_id WHERE m.conversation_id = _conv AND c.is_group AND m.profile_id = public.current_profile_id()) THEN RAISE EXCEPTION 'not in this group'; END IF;
  IF length(trim(coalesce(_title,''))) = 0 OR length(_title) > 60 THEN RAISE EXCEPTION 'bad group name'; END IF;
  UPDATE public.conversations SET title = trim(_title), emoji = nullif(left(coalesce(_emoji,''), 8), '') WHERE id = _conv;
END $$;

CREATE OR REPLACE FUNCTION public.remove_group_member(_conv uuid, _member uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid := public.current_profile_id(); _owner uuid;
BEGIN
  SELECT created_by INTO _owner FROM public.conversations WHERE id = _conv AND is_group;
  IF NOT FOUND THEN RAISE EXCEPTION 'group not found'; END IF;
  IF _member <> _me AND (_owner IS NULL OR _owner <> _me) THEN RAISE EXCEPTION 'only the group creator can remove people'; END IF;
  DELETE FROM public.conversation_members WHERE conversation_id = _conv AND profile_id = _member;
  IF _member = _owner THEN
    UPDATE public.conversations SET created_by = (SELECT profile_id FROM public.conversation_members WHERE conversation_id = _conv LIMIT 1) WHERE id = _conv;
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.add_group_members(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_group(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_group_member(uuid, uuid) TO authenticated;