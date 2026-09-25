# 01: Create and save a project

**What to build:** A project coordinator can create a project with name, category, location, dates, and description, then see it in a local saved-project list after refresh.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Project form validates required fields
- [x] Project is saved in localStorage
- [x] Saved projects can be opened after refresh
- [x] Empty and invalid form states are understandable

## Implementation summary

- Scaffolded the Next.js App Router application with Tailwind CSS and shadcn Base UI wrappers while retaining Geist.
- Added the project model, accessible required-field and chronological-date validation, Zustand `persist` localStorage storage, saved-project list, and project detail route.
- Added a Playwright journey covering empty and invalid states, save, refresh, reopen, 360px layout, and browser-console cleanliness.
- Completed standards and spec review; removed speculative field limits/timestamps, non-transform motion transitions, and unrelated generated documentation. Downstream upload, Cloudinary, OpenRouter, timeline, report, authentication, and database work remains unimplemented.
- Verified with `npm run typecheck`, `npm run lint`, `npm run test:e2e`, and `npm run build`.
