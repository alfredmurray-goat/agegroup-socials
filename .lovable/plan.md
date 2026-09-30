# lowkey_social media studio plan

## Goal
Replace the current upload form with a full-screen, multi-step media studio. Users can edit photos and videos, add music, save unfinished work to their account, and open feed photos full-screen.

## Experience

### 1. New upload studio
- Replace the existing stacked form with a focused workspace:
  - **Start**: camera, photo/video library, text-only post, and saved drafts.
  - **Edit**: large media canvas with a bottom tool rail.
  - **Details**: caption, title, topic, audience reminder, and final preview.
  - **Publish**: render progress, upload progress, retry, and success state.
- Keep the current sunny palette, Outfit/Figtree type, light default, large touch targets, low-vision settings, and lowercase voice.
- Make the workspace fill the available screen on mobile without horizontal scrolling or keyboard zoom.

### 2. Advanced photo editing
- Crop with common aspect ratios, pinch zoom, pan, rotate, and flip.
- Brightness, contrast, saturation, warmth, fade, and preset filters.
- Add movable text overlays with font, size, alignment, and readable color choices.
- Keep edits non-destructive in the draft; bake them into a new upload only when publishing.

### 3. Advanced video editing
- Import multiple clips and reorder or remove them.
- Trim each clip with a touch-friendly timeline and choose a cover frame.
- Change speed, crop/rotate, apply the same visual adjustments as photos, and add text overlays.
- Control original-video volume and song volume independently, including mute and song start time.
- Render the finished result in the browser with hardware acceleration when supported, with a compatibility fallback and clear unsupported-format errors.

### 4. Music
- Provide two tabs: **lowkey library** and **your audio**.
- Bundle a small initial catalog of explicitly royalty-free/CC0 tracks with title, artist/source, duration, and license attribution.
- Let users upload audio they have permission to use and require a rights confirmation before publishing.
- Preview tracks, scrub through them, choose a start point, and remove or replace the selection.
- Show `song playing is: <title> — <artist>` on the editor preview and published post/video.
- For photo posts, keep the selected audio as a separately playable track. For videos, mix it into the rendered video while retaining song attribution metadata.

### 5. Account-synced drafts
- Autosave editor text and edit settings after changes, with a visible saved/saving state.
- Store unfinished source media privately under the user’s account so drafts resume on another device.
- Add a drafts view to the studio start screen with thumbnail, type, last edited time, resume, and delete.
- Only the owner can read, edit, or delete a draft. Drafts never appear in feeds and do not bypass age verification at publish time.
- Delete abandoned draft files when the user deletes a draft; remove a draft after a successful post.

### 6. Full-screen feed photos
- Make every feed photo a real button with an accessible label.
- Open it in a full-screen viewer using the original aspect ratio and `object-contain`, not a forced square crop.
- Include close, like, comments, save, author, caption, and song controls without covering the photo.
- Support Escape, backdrop close, swipe-down on touch, focus trapping, screen-reader announcements, and reduced-motion mode.

## Data and privacy
- Add an owner-only `post_drafts` table for draft metadata and the non-destructive edit document.
- Add a `music_tracks` table for the built-in catalog and user-owned tracks, including source/license fields.
- Extend posts additively with song attribution, optional audio path, cover information, and an edit/render manifest; keep existing posts working unchanged.
- Add a child media table for ordered source/final assets so multi-clip posts no longer depend on the current single-media column.
- Grant only the required database permissions, enable row-level protection, and enforce ownership on every draft and uploaded personal track.
- Reuse the private media storage flow with separate `drafts/`, `audio/`, and rendered-output paths; signed links remain required.
- Never upload or publish a user’s original media until they choose it for a synced draft; clearly show that synced drafts are stored online.

## Technical details
- Use `react-easy-crop` plus Canvas 2D for mobile photo crop, rotate, filters, and text export.
- Use Mediabunny/WebCodecs for video decoding, trimming, cover extraction, clip composition, and encoding. Use Web Audio for volume and song mixing.
- Dynamically load all editor engines only inside the browser so the rest of the app and first feed load stay small.
- Keep a single-threaded ffmpeg.wasm fallback isolated and lazy-loaded only for formats the primary browser pipeline cannot process; avoid cross-origin-isolation requirements.
- Split the studio into small picker, canvas, timeline, adjustments, text, music, details, drafts, and render components rather than rebuilding one oversized page.
- Extend the existing store with draft, music, multi-asset, and publish operations while preserving the existing signed-upload progress behavior.

## Validation
- Verify photo editing, multi-clip trimming, audio mix, draft resume on a fresh session, deletion cleanup, and publishing for both photo and video posts.
- Verify old posts still render and new song labels/audio work in the home feed and video feed.
- Test full-screen photos, the editor, and keyboard behavior at mobile and desktop sizes.
- Test low-vision text sizes, high contrast, read-aloud labels, keyboard navigation, reduced motion, and touch targets.
- Test access rules so another account cannot read or modify someone else’s drafts or private audio.
