# Goal 01 — Create and save a project

## Goal

Scaffold the Next.js application and implement ticket 01: a coordinator can create a project and see it saved in a local project list after refresh.

## Current state

- **Branch:** `master`
- **HEAD:** No commits yet
- **Dirty/untracked files:** Existing PDF, `tmp/`, `CONTEXT.md`, `AGENTS.md`, `docs/`, `.scratch/`
- **Evidenced complete:** Product decisions and spec only
- **Known gaps:** No Next.js app, package manifest, project form, or localStorage project list
- **Existing failures:** No application exists to run yet

## Execution order

1. Scaffold the Next.js app (with Tailwind) without disturbing existing files; run `npx shadcn init` with **Base UI** as the primitive library, and install `zustand`, `sonner`, `motion`, `clsx`, and `cva`. Feature code imports only the local `components/ui/*` wrappers, never Base UI directly.
2. Add the design foundations (see Design conventions): mount `<Toaster />` once in the root layout, keep the scaffold font (Geist via `next/font`) unchanged, and confirm shadcn's semantic CSS-variable tokens are generated.
3. Add the project domain model.
4. Build the project creation form.
5. Add localStorage persistence via zustand's `persist` middleware — the single storage seam for the whole MVP.
6. Build the saved-project list and open-project behavior.
7. Add focused behavior tests.
8. Run the smallest applicable validation.
9. Run code review against the current no-commit baseline.

## Completion criteria

- [ ] Project form validates required fields.
- [ ] Project saves to localStorage.
- [ ] Saved projects remain after refresh.
- [ ] Saved projects can be opened.
- [ ] Empty and invalid form states are understandable.
- [ ] `npm run dev` renders with no console errors or warnings.
- [ ] Form and saved-project list are usable at 360px viewport width.
- [ ] `npm run build` passes.
- [ ] Applicable tests pass.
- [ ] Code review is complete.
- [ ] No downstream Cloudinary/OpenRouter/report work is implemented.
- [ ] Unrelated workspace files remain untouched.

## Constraints

- Do not implement upload, Cloudinary, OpenRouter, timeline, or report tickets.
- Do not add PostgreSQL, authentication, or public sharing.
- Preserve the existing PDF, `tmp/`, `CONTEXT.md`, and agent configuration.
- Do not commit or push unless authorized.
- Use behavior tests rather than implementation-detail tests.

## Design conventions

Bake these in from the scaffold; they are cheap now and painful to sweep for later.

- Define easing variables in global CSS: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`; all transitions reference the variables, never raw easings.
- Animate only `transform` and `opacity`; never `height`, `width`, `margin`, or `padding`.
- Use CSS transitions, not keyframes, for anything rapidly triggered; UI animations stay under 300ms and use ease-out (never ease-in).
- Never enter from `scale(0)`; start from `scale(0.95)` with `opacity: 0`.
- Button primitive includes `:active { transform: scale(0.97) }` with a 160ms ease-out transition.
- Gate hover effects behind `@media (hover: hover) and (pointer: fine)`; respect `prefers-reduced-motion` (keep opacity fades, remove movement).
- Feature code uses shadcn semantic tokens only (`bg-background`, `text-muted-foreground`, …); never raw palette classes like `bg-gray-100`.
- Form errors appear inline, adjacent to their field, wired with `aria-describedby` / `aria-invalid` via shadcn field components.
- Popovers use `transform-origin: var(--transform-origin)` (Base UI provides it); modals stay centered.
- Defer all taste tuning (durations, staggers, delight moments) to ticket 07's polish pass.

## Context

- **Spec:** `.scratch/cloudinary-impact-mvp/spec.md`
- **Ticket:** `.scratch/cloudinary-impact-mvp/issues/01-create-save-project.md`
- **Domain instructions:** `AGENTS.md`, `CONTEXT.md`, `docs/agents/domain.md`
- **Test seam:** project-coordinator journey from project creation to saved project reopening
