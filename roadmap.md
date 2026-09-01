# lowkey social roadmap

## done
- 6 screens + search/settings on a localStorage store mirroring the planned schema
- age band split (under 18 / 18+), streaks, daily limit
- logo, favicon, beta labelling, feedback email (alfredcasper1010@gmail.com)
- free on-device face age check (face-api.js, nothing uploaded) + simulated eID fallback
- supabase-backed store, email + google auth
- long onboarding (identity, interests, vibe, pace, limit, consent)
- privacy notice route + gdpr export/delete in settings
- consent logging for face scan / eid
- likes/comments/follows/bookmarks real + optimistic, /saved, notifications + realtime toasts
- clickable handles -> /u/$handle with follow / follow back / chat
- profile picture upload (private bucket, signed urls), real media uploads
- gdpr cookie notice, favicon, sitemap, robots.txt, json-ld
- big settings page, real instagram data-export import, heic upload fix
- low-vision accessibility (text scale, high contrast, bold), read-aloud screen reader

## in progress (approved plan 2026-09-01)
- moderation & content deletion: delete/edit own posts, delete own comments/messages,
  report posts/comments/profiles, admin inbox at /admin with user_roles + has_role
- photos in DMs (private media bucket, signed urls)
- installable home-screen PWA (manifest + icons, no service worker)
- email notifications (follow/like/comment/dm) with per-user toggles — blocked on email
  domain setup for the project
- status updates on profiles ("what are you doing right now")
- redo create screen + post titles shown on the home feed; remove verified badge on own profile
- daily limit resets at midnight in the user's local timezone (was UTC)
- [bug] "change my limit" from the limit screen does nothing — AppScreen re-blocks /settings

## open
- own supabase project instead of managed backend (workspace-admin action, blocked)

## backend ownership (open decision)
- user wants their own supabase project + api keys instead of the managed cloud backend
- blocked on me: disconnecting the managed backend is a workspace-admin action (cloud tab -> advanced) and is irreversible; connecting a byo supabase project is done in project settings
- schema is portable: drizzle/migrations/*.sql can be run on any supabase project