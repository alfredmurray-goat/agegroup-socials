-- demo content for both bands so a freshly verified account lands on a live feed
insert into public.profiles (id, user_id, handle, display_name, bio, avatar_hue, age_band, verification_status, verified_provider, daily_limit_minutes, is_demo) values
  ('11111111-1111-4111-8111-000000000001', null, 'william', 'william', 'bla bla bla bla bla', 45, 'under_18', 'verified', 'face_scan', 60, true),
  ('11111111-1111-4111-8111-000000000002', null, 'kebnik', 'kebnik', 'skate, snacks, chill', 200, 'under_18', 'verified', 'face_scan', 60, true),
  ('11111111-1111-4111-8111-000000000003', null, 'noa', 'noa', 'mostly here for the videos', 92, 'under_18', 'verified', 'mitid', 45, true),
  ('11111111-1111-4111-8111-000000000004', null, 'mira', 'mira', 'coffee then everything else', 320, 'adult', 'verified', 'mitid', 90, true),
  ('11111111-1111-4111-8111-000000000005', null, 'jonas', 'jonas', 'lowkey posting from copenhagen', 145, 'adult', 'verified', 'mitid', 90, true),
  ('11111111-1111-4111-8111-000000000006', null, 'sara', 'sara', 'runs slow, talks fast', 20, 'adult', 'verified', 'altid', 120, true);

insert into public.posts (id, author_id, kind, caption, poster_hue, tagged_handle, age_band, created_at) values
  ('22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-000000000001', 'post', 'at rebunk w/ @kebnik', 45, 'kebnik', 'under_18', now() - interval '24 minutes'),
  ('22222222-2222-4222-8222-000000000002', '11111111-1111-4111-8111-000000000002', 'post', 'board went one way i went the other', 200, null, 'under_18', now() - interval '3 hours'),
  ('22222222-2222-4222-8222-000000000003', '11111111-1111-4111-8111-000000000003', 'video', 'bla bla bla bla bla', 92, null, 'under_18', now() - interval '5 hours'),
  ('22222222-2222-4222-8222-000000000004', '11111111-1111-4111-8111-000000000002', 'video', 'no caps no grammar just vibes', 200, null, 'under_18', now() - interval '9 hours'),
  ('22222222-2222-4222-8222-000000000005', '11111111-1111-4111-8111-000000000004', 'post', 'third coffee, no regrets', 320, null, 'adult', now() - interval '1 hour'),
  ('22222222-2222-4222-8222-000000000006', '11111111-1111-4111-8111-000000000005', 'video', 'harbour swim in september, cold as promised', 145, null, 'adult', now() - interval '2 hours'),
  ('22222222-2222-4222-8222-000000000007', '11111111-1111-4111-8111-000000000006', 'post', '10k, walked most of it', 20, null, 'adult', now() - interval '7 hours'),
  ('22222222-2222-4222-8222-000000000008', '11111111-1111-4111-8111-000000000004', 'video', 'sunset from the roof, no filter', 320, null, 'adult', now() - interval '11 hours');

insert into public.post_comments (post_id, author_id, body, created_at) values
  ('22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-000000000002', 'no way you were there', now() - interval '20 minutes'),
  ('22222222-2222-4222-8222-000000000005', '11111111-1111-4111-8111-000000000005', 'same tbh', now() - interval '40 minutes');

insert into public.post_likes (post_id, profile_id) values
  ('22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-000000000003'),
  ('22222222-2222-4222-8222-000000000005', '11111111-1111-4111-8111-000000000006');

insert into public.follows (follower_id, following_id) values
  ('11111111-1111-4111-8111-000000000001', '11111111-1111-4111-8111-000000000002'),
  ('11111111-1111-4111-8111-000000000003', '11111111-1111-4111-8111-000000000002'),
  ('11111111-1111-4111-8111-000000000005', '11111111-1111-4111-8111-000000000004'),
  ('11111111-1111-4111-8111-000000000006', '11111111-1111-4111-8111-000000000004');
