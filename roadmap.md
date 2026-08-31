# lowkey social roadmap

## done
- 6 screens + search/settings on a localStorage store mirroring the planned schema
- age band split (under 18 / 18+), streaks, daily limit
- logo, favicon, beta labelling, feedback email (alfredcasper1010@gmail.com)
- free on-device face age check (face-api.js, nothing uploaded) + simulated eID fallback

## open
- move backend to Supabase (Lovable Cloud): auth, profiles, posts, chats, streaks, RLS age-band wall
- GDPR / EU: privacy page, consent for the camera check, data export + delete account, EU region note, minimal data retention

## backend ownership (open decision)
- user wants their own supabase project + api keys instead of the managed cloud backend
- blocked on me: disconnecting the managed backend is a workspace-admin action (cloud tab -> advanced) and is irreversible; connecting a byo supabase project is done in project settings
- schema is portable: drizzle/migrations/0000_lowkey_core_schema.sql + 0001_lowkey_demo_content.sql can be run on any supabase project
- long personalised onboarding: handle/name, avatar colour, age check, interests, vibe, who to follow, streak + daily-limit setup, privacy/consent, done

- [x] supabase-backed store, email + google auth
- [x] long onboarding (identity, interests, vibe, pace, limit, consent)
- [x] privacy notice route + gdpr export/delete in settings
- [x] consent logging for face scan / eid

## real-data pass (done)
- removed all demo/seed profiles + posts from the database; only real accounts remain
- likes, comments, follows, bookmarks: optimistic ui + real rows
- clickable handles everywhere -> /u/$handle with follow / follow back / chat
- notifications table + realtime toast ("@x followed you — follow back?") and /notifications
- /saved for bookmarks; profile picture upload (private avatars bucket, signed urls)
- real media uploads for posts/videos (private media bucket, signed urls)
- gdpr cookie/storage notice, favicon from the logo, sitemap.xml, ai-crawler robots.txt, json-ld (WebApplication + FAQ)

## settings + uploads pass (done)
- big settings page: profile, appearance (theme, reduce motion, avatar colour), privacy & safety (private, dm/comment audience, hide from search, blocks), notifications & wellbeing, account & security (email, password, sign out everywhere)
- real instagram import from the official data export (zip/json) -> posts, captions, media, original dates
- photo upload fix: heic/no-mime files accepted, images re-encoded to jpeg client-side, avatar bucket 5mb -> 50mb, media 50mb -> 200mb
