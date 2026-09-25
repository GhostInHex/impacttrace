# 06: Generate and export the impact report

**What to build:** A coordinator can generate a Markdown impact report containing summary, timeline, evidence table, before/after section, recommendations, source links, and missing-evidence warnings, then print or save it as PDF.

**Blocked by:** 05 — Review evidence and timeline

**Status:** completed

- [x] Exactly one report request is made
- [x] Report includes all agreed sections
- [x] Missing evidence is not invented
- [x] Browser print/save-as-PDF works

## Design additions

- Give the report a deliberate content hierarchy: summary, timeline, evidence table, before/after, recommendations, and source links.
- Render missing evidence as a deliberate “Not enough evidence” state rather than blank or invented content.
- Add print-only styles that hide navigation and actions, preserve source links, prevent awkward page breaks, and keep evidence tables readable.
- Provide an on-screen report state before print/PDF export; do not make print the only readable output.
- Use semantic document headings and accessible link text for source assets.
- Keep report generation motion minimal and respect reduced-motion preferences.



## Hardening additions

- Allow long report text, long source URLs, large evidence tables, missing sections, and empty recommendations to render without truncation or horizontal overflow.
- Define print behavior for multi-page reports, repeated table headers, long links, and page-break-sensitive media cards.
- Keep the on-screen report usable when printing is unavailable or the browser blocks print styling.
- Use a clear failure state for report rate limits, missing evidence, and provider errors without exposing secrets or raw responses.

## Implementation summary

- Added a single-request report boundary that receives only reviewed compact metadata and returns Markdown with all required sections.
- Added a local deterministic fallback, explicit `Not enough evidence` states, provider-safe failure messages, and a semantic on-screen Markdown renderer.
- Added print/save-as-PDF controls and print styles for headings, tables, source links, long content, and page breaks.
- Validation: `npm run typecheck`, `npm run lint`, and `npx playwright test tests/report-export.spec.ts` pass.
