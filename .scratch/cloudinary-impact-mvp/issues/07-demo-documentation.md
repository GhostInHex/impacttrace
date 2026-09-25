# 07: Complete the demo journey and documentation

**What to build:** A polished tree-plantation demo can be completed from project creation through report generation, with secondary water and infrastructure examples and clear setup documentation.

**Blocked by:** 06 — Generate and export the impact report

**Status:** completed

- [x] Primary tree-plantation demo is usable end-to-end
- [x] Secondary examples use the same workflow
- [x] Setup and environment variables are documented
- [x] README explains demo limitations and source requirements
- [x] Build and review checks pass

## Design additions

- Polish the primary tree-plantation journey as the demo path; do not redesign completed project creation.
- Ensure loading, empty, success, needs-review, and failure states are visually consistent across upload, analysis, review, and report screens.
- Add a compact responsive pass for 360px, tablet, and desktop widths, including media grids, timeline cards, and report tables.
- Add a focused accessibility pass: labels, focus order, keyboard actions, status announcements, contrast, and non-color uncertainty cues.
- Capture a small set of demo screenshots and a short demo path for the README; keep decorative prototype variants out of production.
- Use existing semantic tokens, transform/opacity-only motion, 300ms maximum UI transitions, and reduced-motion handling.



## Hardening additions

- Verify the final demo with 360px, 768px, and desktop widths, plus 200% browser zoom and keyboard-only navigation.
- Confirm the demo remains understandable with slow network, partial analysis, low-confidence results, and a missing-evidence report.
- Check that long project names, captions, source URLs, and report sections do not break the visual hierarchy or cause horizontal scrolling.
- Add a short recovery checklist for missing Cloudinary/OpenRouter credentials so the demo setup failure is understandable.

## Implementation summary

- Added one-click tree-plantation, water-conservation, and infrastructure scenarios that start with labeled local assets and use the same full workflow.
- Added `.env.example`, `README.md`, and `docs/demo-journey.md` covering setup, provider boundaries, limitations, media-source requirements, responsive checks, and recovery.
- Added end-to-end demo coverage at 360px and a final accessibility/responsive pass across the workflow surfaces.
- Final validation: `npm run typecheck`, `npm run lint`, `npm run test:e2e`, and `npm run build` pass.
