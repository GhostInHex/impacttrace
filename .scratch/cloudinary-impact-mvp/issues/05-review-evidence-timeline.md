# 05: Review evidence and timeline

**What to build:** A coordinator can review tags, groups, timeline events, and before/after pairs, with low-confidence results highlighted and editable before report generation.

**Blocked by:** 04 — Group evidence with OpenRouter

**Status:** completed

- [x] Suggestions are displayed clearly
- [x] Low-confidence results are highlighted
- [x] User can confirm or reject suggestions
- [x] Timeline and before/after selections persist

## Design additions

- Add a review workspace that separates AI suggestions from confirmed project facts.
- Provide clear confirm, reject, and edit actions for tags, evidence groups, timeline events, and before/after pairs.
- Visually distinguish low-confidence and missing-evidence items without relying on color alone.
- Make the timeline readable on mobile with vertical stacking and clear date/event hierarchy.
- Make before/after pairs usable with captions, source links, keyboard focus, and a non-drag alternative to any slider.
- Persist review state without introducing a new navigation model or dashboard complexity.



## Hardening additions

- Support long project descriptions, long AI summaries, long dates, empty evidence, and invalid or reversed date ranges without breaking the review layout.
- Provide an explicit empty state when no valid before/after pair exists instead of showing a broken comparison.
- Ensure every confirm/reject/edit action has a keyboard focus state and a non-color status cue.
- Preserve confirmed review state when a later suggestion is rejected or the page is revisited.

## Implementation summary

- Added a persisted review workspace separating media tags, evidence groups, timeline events, and before/after pairs.
- Added confirm, reject, reset, and edit actions for every suggestion family, with text-and-icon low-confidence cues and an explicit missing-pair state.
- Review decisions and edits survive refreshes and are stored with the project in browser localStorage.
- Validation: `npm run typecheck`, `npm run lint`, and `npx playwright test tests/review-evidence.spec.ts` pass.
