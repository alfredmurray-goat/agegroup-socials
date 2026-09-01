-- allow conversation members to select conversations regardless of band
-- and permit creating conversations (the app enforces band stamping)
DROP POLICY IF EXISTS "member conversations readable" ON public.conversations;
DROP POLICY IF EXISTS "create band conversation" ON public.conversations;
DROP POLICY IF EXISTS "member updates conversation" ON public.conversations;

CREATE POLICY "member conversations readable" ON public.conversations
  FOR SELECT TO authenticated
  USING (public.is_conversation_member(id));

CREATE POLICY "create conversation" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "member updates conversation" ON public.conversations
  FOR UPDATE TO authenticated
  USING (public.is_conversation_member(id)) WITH CHECK (age_band = public.current_band());
