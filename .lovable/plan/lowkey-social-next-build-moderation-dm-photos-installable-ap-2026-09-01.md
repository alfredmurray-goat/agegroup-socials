# Lowkey Social — next build: moderation, DM photos, installable app, email

Four additions in one pass: real content moderation and deletion, photos in DMs, an installable phone app, and email notifications.

## 1. Moderation & content deletion

- **Delete your own posts** — overflow menu on feed cards, the video screen, and the profile grid. Deleting a post removes its likes, comments, bookmarks, and notifications with it.
- **Edit post caption** — same overflow menu.
- **Delete your own comments** — in the comments sheet, own comments get a delete action.
- **Delete your own messages** — long-press a chat bubble to delete it.
- **Report content** — report button on posts, comments, and profiles with a reason picker. Stored in a new `reports` table; the reported user never sees it.
- **Admin inbox** — a new `/admin` page where the app owner reviews reports and removes content. Admin role lives in a proper `user_roles` table with a `has_role` security-definer helper, and Alfred's account is seeded as admin by email.

## 2. Photos in DMs

- Attach button in the chat compose bar. Photos are re-encoded like post uploads (HEIC-safe, compressed JPEG), stored in the existing private media bucket, and shown as image bubbles with signed URLs.
- Works exactly like post media uploads — no new bucket, same privacy model.

## 3. Installable app (home-screen PWA)

- Web app manifest, proper app icons (192 + 512 from the logo, maskable), `display: standalone`, apple-touch icons, and matching head tags.
- "Add to Home Screen" on phones, full-screen from an app icon, app-style launching.
- Home-screen support only — no offline caching or service worker, so Lovable previews stay safe and nothing can go stale. Make pwa auto update when downloaded.

## 4. Email notifications

- When someone follows, likes, comments, or DMs you — and you're not currently active — an email is sent from the app's sending domain.
- Sending domain: `rainz.net` (the only verified domain in the workspace). Can be swapped for the project's own domain later without code changes.
- Per-user toggles in settings > notifications & wellbeing (follows, likes, comments, DMs) and quiet hours are respected. Email is off by default until the user enables it, to stay GDPR-friendly.

5. status updates

On the users profile they can type what they are doing right now.

6. new posts

redo the create post screen and that yoiu can now also titel the posts and make sure it shows on the homescreen and remove the verified badge on my profile.

---

## Technical notes

- **One migration** (`0007_lowkey_moderation_media_email.sql`) adds:
  - `reports` table (reporter, target type + id, reason) with grants + RLS — insert own report, select own reports, service-role full access
  - `user_roles` + `app_role` enum + `has_role()` security-definer helper, grants without anon (auth-only)
  - `messages.media_path text` column
  - Email-preference columns on `profiles` (`email_follows`, `email_likes`, `email_comments`, `email_dms`, default false)
  - DELETE/UPDATE RLS policies for own posts, comments, and messages (currently only select/insert exist)
  - Admin seed: `INSERT ... SELECT id FROM auth.users WHERE email = 'alfredcasper1010@gmail.com'`
- **Storage**: reuses the existing private `media` bucket and signed-URL flow from post uploads.
- **Email**: scaffold the transactional email template system on the verified domain; sends happen server-side from a small server function called right after an in-app notification is written, reading the recipient's prefs and quiet hours first.
- **Routing**: new `/admin` route (report inbox) with its own `head()` metadata; gated on `has_role(auth.uid(), 'admin')` server-side, not client storage.
- **PWA**: manifest-only per the PWA skill — `public/manifest.webmanifest`, icons generated from the logo, head tags in `__root.tsx`. No `vite-plugin-pwa`, no service worker.

## Build order

1. Migration: schema, RLS, grants, admin seed
2. Store actions: deletePost, editCaption, deleteComment, deleteMessage, report, uploadMessagePhoto
3. Deletion + report UI (overflow menus, comments sheet, chat bubbles)
4. Admin inbox route + report review flow
5. DM photo compose + bubbles
6. PWA manifest + icons + head tags
7. Email templates + server send + settings toggles