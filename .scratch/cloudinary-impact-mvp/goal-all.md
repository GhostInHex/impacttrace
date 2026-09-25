# Persistent Goal — Cloudinary + OpenRouter Impact Media MVP

Status: in_progress
Source: `.scratch/cloudinary-impact-mvp/spec.md`
Execution: tickets 02 → 03 → 04 → 05 → 06 → 07
Ticket 01 is already complete and must not be reimplemented.

## Goal

Complete the remaining MVP tickets in dependency order until the project supports project creation, Cloudinary media upload and analysis, batch media processing, OpenRouter evidence grouping, user review, timeline and before/after evidence, impact report generation, print/PDF export, and demo documentation.

## Current state

- Repository: `C:\Users\vinay\Documents\AI\hackathon\codecubicle`
- Branch: `master`
- Git history: baseline commits exist; ticket commits are created after each review checkpoint
- Next frontier: ticket 03 — Upload and analyze a media batch
- Existing app: Next.js App Router project
- Existing validation commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test:e2e`
  - `npm run build`
- External services require environment variables for Cloudinary and OpenRouter.

## Progress log

- Ticket 02 completed: Cloudinary upload boundary, source metadata preservation, visible analysis phases, and recoverable failures.

## Commit policy

- After each ticket passes its acceptance criteria, validation, and code review, create one real local commit.
- Use honest current timestamps only.
- Never fabricate commits or backdate history.
- Never rewrite, amend, or replace existing commits to simulate past work.
- Do not push, open pull requests, merge, or deploy automatically.
- Suggested commit messages:
  - `feat(media): add Cloudinary image upload and analysis`
  - `feat(media): add batch media processing`
  - `feat(ai): add OpenRouter evidence grouping`
  - `feat(review): add evidence timeline and before-after review`
  - `feat(report): generate impact reports`
  - `chore(demo): finalize documentation and submission flow`

## Ticket file map and execution loop

The runner must read the goal file first, then read the linked ticket file before implementing that ticket. After a ticket passes validation and review, return to this goal file, record completion, and select the next unblocked linked ticket.

- [Ticket 02 — Upload and analyze one image](issues/02-upload-analyze-image.md)
- [Ticket 03 — Upload and analyze a media batch](issues/03-upload-analyze-batch.md)
- [Ticket 04 — Group evidence with OpenRouter](issues/04-openrouter-grouping.md)
- [Ticket 05 — Review evidence and timeline](issues/05-review-evidence-timeline.md)
- [Ticket 06 — Generate and export the impact report](issues/06-generate-export-report.md)
- [Ticket 07 — Complete the demo journey and documentation](issues/07-demo-documentation.md)

Runner loop:

1. Read this goal file.
2. Find the first linked ticket that is not completed and whose blockers are complete.
3. Read that ticket file completely.
4. Implement only that ticket.
5. Run its smallest applicable validation.
6. Run the code-review flow.
7. Create the ticket's real local commit.
8. Return to this goal file.
9. Re-evaluate the frontier and repeat with the next linked ticket.
10. Stop after ticket 07 passes final validation.

## Execution order

### Ticket 02 — Upload and analyze one image

- Upload one image through Cloudinary.
- Preserve source public ID and URL.
- Show progress, analysis state, tags, caption, OCR, confidence, and recoverable failure.

### Ticket 03 — Upload and analyze a media batch

- Support multi-file selection.
- Enforce a maximum of twelve assets.
- Show per-file states.
- Support short-video analysis signals.
- Handle per-file failures.

### Ticket 04 — Group evidence with OpenRouter

- Send only compact metadata.
- Make one grouping request.
- Parse JSON suggestions for evidence groups, timeline events, and before/after pairs.
- On invalid JSON, show manual continuation without retry.

### Ticket 05 — Review evidence and timeline

- Display suggestions.
- Highlight low-confidence results.
- Allow confirm/reject/edit actions.
- Persist confirmed review state.
- Show timeline and before/after selections.

### Ticket 06 — Generate and export the impact report

- Make one report request.
- Generate Markdown containing summary, timeline, evidence table, before/after, recommendations, and source links.
- Mark missing evidence as `Not enough evidence`.
- Support browser print/save-as-PDF.

### Ticket 07 — Complete demo and documentation

- Make the tree-plantation demo work end to end.
- Support water and infrastructure examples.
- Document setup and environment variables.
- Document demo limitations and media-source requirements.
- Run final validation and review.

## Required validation

After each ticket:

```text
npm run typecheck
npm run lint
```

Run focused Playwright tests for changed behavior.

Before final completion:

```text
npm run typecheck
npm run lint
npm run test:e2e
npm run build
```

## Constraints

- Read `AGENTS.md`, `CONTEXT.md`, and `docs/agents/domain.md` before implementation.
- Do not add PostgreSQL, authentication, public sharing, or unrelated features.
- Do not send raw media to OpenRouter.
- Do not automatically retry invalid OpenRouter output.
- Do not implement blocked tickets early.
- Use mocked service boundaries for deterministic tests.
- Stop and report a blocker if required credentials or permissions are unavailable.
- Do not modify unrelated workspace files.

## Session recommendation

- **Session:** persistent goal loop
- **Capability:** Advanced
- **Intensity:** High
- **Reason:** This goal spans external media processing, AI requests, persistence, review state, report generation, UI integration, and end-to-end validation.
- **Start:** ticket 02
- **Then:** ticket 03 → ticket 04 → ticket 05 → ticket 06 → ticket 07

## Launch

```text
/to-goal --all .scratch/cloudinary-impact-mvp/spec.md
```

The runner should execute this contract ticket-by-ticket and commit only after each ticket passes validation and review.
