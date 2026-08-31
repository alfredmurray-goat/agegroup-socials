-- users own a folder named after their auth uid in both buckets
CREATE POLICY "read lowkey media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('avatars','media'));

CREATE POLICY "upload own lowkey media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('avatars','media')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "update own lowkey media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars','media') AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "delete own lowkey media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars','media') AND (storage.foldername(name))[1] = auth.uid()::text);