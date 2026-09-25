# 03: Upload and analyze a media batch

**What to build:** A coordinator can select up to twelve images and short videos, see per-file progress, and receive available image/video tags, OCR, and transcript signals.

**Blocked by:** 02 — Upload and analyze one image

**Status:** completed

- [x] Multi-file selection is supported
- [x] Maximum of twelve assets is enforced
- [x] Per-file upload and analysis states are visible
- [x] Short video signals are shown when available

## Design additions

- Add a responsive batch-upload area that supports multi-select and clearly shows the 12-asset limit before submission.
- Use a consistent asset grid/list with per-file thumbnail, filename, media type, progress, status, confidence, and retry action.
- Use a video placeholder/preview treatment rather than loading full videos into the page.
- Keep file progress and failures visible inline; do not collapse the whole batch into one spinner.
- Add keyboard-accessible file selection and `aria-live` updates for completed, failed, and needs-review assets.
- Preserve the Field Journal visual language without adding a second navigation or a new color system.



## Hardening additions

- Allow the batch to finish with a mix of successful, failed, and needs-review assets; one failure must not erase successful work.
- Handle long filenames, unsupported media, oversized files, offline/slow connections, rate limits, and service errors with inline per-asset recovery actions.
- Keep progress and status understandable when the tab is backgrounded or the connection is intermittent.
- Verify 360px width and 200% zoom without horizontal scrolling or inaccessible action labels.

## Implementation summary

- The field journal accepts multi-file image and short-video selection, enforces the twelve-asset cap before submission, and updates each asset independently.
- Added a video-safe source card, transcript/OCR signal display, per-file retry states, and a labeled eight-asset demo journal.
- Added focused Playwright coverage for the limit and mixed media signals.
- Validation: `npm run typecheck`, `npm run lint`, and `npx playwright test tests/media-batch.spec.ts` pass.
