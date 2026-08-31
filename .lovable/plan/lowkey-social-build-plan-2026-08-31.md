# Lowkey Social — build plan

A chill, no-caps social app. Six screens, real backend, and a hard split so under-18 accounts only ever see under-18 content and 18+ accounts only see 18+ content.

## On EU-wide age verification

There is a real EU answer, and it's the same shape as MitID/AltID:

- **eIDAS 2.0 / EU Digital Identity Wallet** — the official EU scheme. It includes an age-verification proof ("over 18" / age band) without revealing full identity. Rolling out across member states now.
- **eID brokers** (Signicat, Criipto, itsme, Nets) — one integration that covers MitID (DK), BankID (SE/NO), itsme (BE), FTN (FI), iDIN (NL), etc. This is how you get MitID and AltID in practice; nobody integrates MitID directly.
- **Document/selfie estimation** (Yoti, Veriff, Onfido) — fallback for anyone without an eID, and the common option for minors who have no bank/eID.

All of these require a signed commercial contract and issued client credentials before they will talk to your app, so v1 builds the **verification layer with a pluggable provider**: one `age-verification` module with a provider interface, a working simulated eID flow that mimics the MitID/EUDI redirect handshake, and a swap-in slot for Signicat/Criipto/EUDI credentials when you have them. Nothing in the app trusts a client-supplied age — the verified age band is written server-side and only server code can set it.

## The age split

Every account carries an immutable-once-verified `age_band`: `under_18` or `adult`.

- Feed, videos, search, profiles, and chat only surface accounts with the **same band**.
- Enforced in the database (row-level rules), not just in the UI, so no request can leak across the wall.
- Unverified accounts land in a "verify to continue" state — they can't post, browse, or message.

## Screens

1. **FYP / Home** — vertical feed of image + text posts, like / comment / share / save rail down the left, bottom tab bar.
2. **Chats** — list of friends with newest message preview, avatar, unread state, streak flame count.
3. **Chat thread** — bubbles, media in-thread, header with name/avatar/streak, compose bar with attach.
4. **Create** — drop or upload image/video, caption text, filters, post type toggle (video / post).
5. **Videos** — full-screen vertical video player, right-hand action rail, creator handle + follow, caption.
6. **Profile** — avatar, handle, follower/following counts, Posts / Videos tabbed grid, settings.

Plus: `/auth` (sign in / sign up), `/verify` (age verification flow).

## Streaks and daily limit

- **Friend streaks** — counts consecutive days two people message each other; flame + number in chat list and thread header, broken automatically after a missed day.
- **Daily limit** — a per-account daily time budget with a gentle "that's enough for today" screen when reached, adjustable in settings.

No ads in v1.

## Design direction

No-caps, chill, low-contrast. Rounded soft cards, lowercase type throughout, warm off-white light mode and a deep charcoal dark mode, one calm accent colour. Yellow colour. Full-height mobile-first layout with a fixed bottom tab bar, built to look right at 390px first.

---

## Technical notes

**Backend**: supabase (Postgres + auth + storage). Enabled as step one.

**Tables** (all with grants + RLS, policies scoped to `auth.uid()`):

- `profiles` — handle, display name, avatar, bio, `age_band`, `verification_status`, `daily_limit_minutes`
- `age_verifications` — provider, provider ref, resolved band, timestamp; service-role write only
- `posts` — author, kind (`post` | `video`), media path, caption, `age_band` denormalised from author
- `post_likes`, `post_comments`, `follows`
- `conversations`, `conversation_members`, `messages`
- `streaks` — pair, count, last-activity date
- `usage_days` — per-account per-day active minutes for the daily limit

**RLS model**: a `same_band(auth.uid(), target)` security-definer helper backs every SELECT policy on `posts`, `profiles`, `follows`, and conversation tables. Inserts into `posts` stamp `age_band` from the author's profile via trigger, so a client cannot forge it.

**Verification flow**: `src/lib/age-verification.functions.ts` exposes `startVerification` / `completeVerification` server functions over a provider interface (`SimulatedEid` in v1; `Signicat`/`Criipto`/`EUDI` later). Provider callback lands on a public server route under `src/routes/api/public/age-verification/callback`, signature-verified, then writes the band with the service-role client. `profiles.age_band` is never writable from the client.

**Routing**: `src/routes/index.tsx` becomes the feed. Signed-in screens live under `src/routes/_authenticated/` (chats, chats/$id, create, videos, profile, settings). `/auth` and `/verify` stay public. Each route gets its own `head()` metadata.

**Media**: Cloud storage buckets for post images/videos and avatars, with band-aware read policies.

**Realtime**: messages and streak updates via Postgres realtime subscriptions in the chat screens.

**Build order**: Cloud + schema/RLS → auth + verification → shell/nav/design system → feed + create → videos → chats + streaks → profile → daily limit.