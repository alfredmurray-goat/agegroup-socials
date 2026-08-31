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
