# 02: Upload and analyze one image

**What to build:** A coordinator can upload one image to Cloudinary, see progress and analysis state, and inspect the source asset, tags, caption, OCR, and confidence.

**Blocked by:** 01 — Create and save a project

**Status:** completed

- [x] Image upload uses the configured Cloudinary flow
- [x] Source public ID and URL are preserved
- [x] Analysis state is visible
- [x] Analysis failure is visible and recoverable

## Design additions

- Extend the project detail page into a Field Journal-style media workspace; keep the existing project-creation route unchanged.
- Add reusable asset cards with source preview, filename, media type, analysis state, and a visible source link.
- Define and render queued, uploading, analyzing, ready, needs-review, and failed states.
- Use inline progress and error feedback; do not rely on a toast for persistent upload state.
- Keep the workspace usable at 360px, with no horizontal scrolling; use existing semantic color tokens and reduced-motion rules.
- Add accessible labels, focus states, `aria-busy`, and status announcements for the upload/analysis action.



## Hardening additions

- Handle long project names, filenames, captions, and source URLs without clipping controls or causing horizontal overflow.
- Treat unsupported file types, oversized files, offline/slow upload, timeout, 401/403/429/5xx responses, and cancelled uploads as visible recoverable states.
- Show a clear retry action for a failed asset without duplicating completed uploads.
- Use a 16px minimum for focused mobile inputs and verify the upload surface at 200% zoom.

## Implementation summary

- Added a server-side Cloudinary upload route that keeps credentials off the client and returns source identity plus analysis signals.
- Added persisted media state, progress phases, source cards, low-confidence cues, and retryable failure states to the project field journal.
- Added a clearly labeled local preview fallback when Cloudinary credentials are not configured.
- Validation: `npm run typecheck`, `npm run lint`, and `npm run test:e2e` pass.
