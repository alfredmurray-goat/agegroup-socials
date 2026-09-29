# lowkey_social — admin, group chats, birthday + face match, landing page, UI refresh

## What changes for you
1. **Push notifications dropped.** Nothing Firebase-related gets built. In-app notifications and emails stay as they are.
2. **Admin dashboard at /app/admin** (only for alfredcasper1010@gmail.com)
   - Overview: user counts per age band, posts today, open reports
   - Reports queue: view the flagged post, comment or user, then resolve or delete
   - Users: search, see band and verification status, remove a user's content, ban or delete accounts
   - Both feeds: switch between the under 18 feed and the 18+ feed to review content (you can only view, not interact)
   - An "admin" link in settings, shown only to you
3. **Mobile fixes**
   - No more zooming in when you tap a text box (text boxes get 16px text, and the page scale gets locked)
   - No more sideways scrolling (the page width gets capped and wide elements are fixed)
4. **Group chats**
   - "new group" button in chats: pick 2+ people you follow in your own age band and give the group a name
   - Group name and member avatars show in the chat list, and each message shows who sent it
   - Photos and deleting your own messages work in groups too. Streaks stay 1:1 only
5. **Age check, two steps**
   - Step 1: enter your birthday. This sets your claimed age
   - Step 2: face scan. If the face estimate matches the claimed band, you're in. If you claim 18+ but the scan says under 18 (or the other way round), you get blocked and can rescan. After 3 failed tries you go into under 18 as the safe default
   - The birthday is stored only as your age band plus birth year, never the full date (keeps the data collected to a minimum under GDPR)
6. **Google sign-in removed.** Email and password only.
7. **Renamed to lowkey_social** everywhere: page titles, emails, app install name, logo text.
8. **Pitch: find people your age near you**
   - Profiles use a city (already there). A new "near you" section shows people in your band and your city
   - Safety: city level only, with no exact location, no map and no distances. Under 18s can only ever see under 18s. Private accounts and "hide from search" are left out
9. **Refreshed look, light mode by default**
   - Light is the new default (people who already picked a theme keep it)
   - Cleaner spacing, softer cards, consistent buttons, a better bottom nav and nicer empty states across every screen, keeping the yellow, lowercase lowkey vibe
10. **New site structure**
    - `/`: a new landing page with animations (the logo drops in, cards float up with a staggered fade, feature sections reveal as you scroll, an animated "under 18 | 18+" split and a sign-up button)
    - `/auth`: sign in or sign up, then onboarding, then the app
    - `/app`: the app itself (feed at /app, with chats, videos, profile, settings and admin under /app/...)
    - Old links (/chats, /settings etc.) redirect to their new /app address

## Technical section
- Migration adds `conversations.is_group bool default false` and `title text`, plus a `start_group(_title, _members uuid[])` security-definer RPC. It checks every member shares the caller's band. Existing member-based RLS still covers group chats
- Migration adds `profiles.birth_year int` and `claimed_band age_band`. Verification compares `claimed_band` with the scan result
- Admin: new policies using `has_role(auth.uid(),'admin')` for profile select/update and report updates. Deleting accounts goes through a server function that checks the admin role, then uses the privileged client
- Routes: move app screens to `src/routes/app.*.tsx`. Add redirect stubs at the old paths. New `index.tsx` landing page with CSS/Motion animations that respect reduce-motion
- Viewport meta gets `maximum-scale=1`. Inputs get a 16px minimum font size. Add `overflow-x: clip` on html and body, and fix wide elements
- Remove `signInWithGoogle` and turn off the Google provider
- Default `theme` changes to `light` in the store fallback and the column default
