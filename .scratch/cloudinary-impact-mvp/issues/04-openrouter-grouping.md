# 04: Group evidence with OpenRouter

**What to build:** The app sends compact project and Cloudinary metadata to OpenRouter and receives JSON suggestions for evidence groups, timeline events, and before/after pairs.

**Blocked by:** 03 — Upload and analyze a media batch

**Status:** completed

- [x] Only compact metadata is sent
- [x] One grouping request is made
- [x] Valid JSON creates suggestions
- [x] Invalid JSON shows manual continuation without retry

## Design additions

- Add a clear “AI organizing evidence” state that explains the grouping step without exposing raw prompts or raw JSON.
- Render suggestions as editable evidence-group and timeline cards, not as a raw model response.
- Show a compact, readable error state when grouping output is invalid, with a manual-continuation action and no automatic retry.
- Use confidence badges and muted metadata hierarchy so reviewers can scan uncertain suggestions quickly.
- Keep source asset identity visible from each suggestion back to the original media.
- Use existing spacing, typography, semantic tokens, transform/opacity motion, and reduced-motion behavior.



## Hardening additions

- Distinguish invalid JSON, truncated JSON, rate limiting, authentication failure, and empty suggestions with actionable but non-technical UI copy.
- Never show raw model output, provider errors, or request payloads as the primary user-facing message.
- Preserve the last valid project state when grouping fails so the coordinator can continue manually.
- Ensure long tags, captions, and source URLs wrap safely in suggestion cards.

## Implementation summary

- Added a server-side OpenRouter grouping route that sends only compact project and media metadata, makes one request, validates the returned JSON, and never retries invalid output.
- Added demo grouping for credential-free local walks, labeled source state, confidence cues, source-linked cards, and a manual continuation path.
- Added focused Playwright coverage for valid suggestions and the one-request invalid-JSON recovery path.
- Validation: `npm run typecheck`, `npm run lint`, and `npx playwright test tests/evidence-grouping.spec.ts` pass.
