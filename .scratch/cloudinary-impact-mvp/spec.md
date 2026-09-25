# SPEC — Cloudinary + OpenRouter Impact Media MVP

Status: ready-for-agent
Route: /to-tickets

## Problem Statement

An NGO project coordinator has field photos and short videos but no reliable way to turn them into organized, traceable impact evidence. Manual tagging, timeline creation, before/after comparison, and report writing are slow and easy to get wrong.

## Solution

Build a small Next.js application where a coordinator creates a project, uploads up to twelve images or short videos, lets Cloudinary analyze the media, and lets OpenRouter suggest evidence groups and a project timeline. The coordinator reviews and confirms uncertain results, selects or confirms before/after pairs, and generates a report that preserves source links, AI analysis, confidence, and missing-evidence warnings.

## User Stories

1. As an NGO project coordinator, I want to create a project with a name, category, location, dates, and description, so that media belongs to a clear initiative.
2. As an NGO project coordinator, I want to select multiple images and short videos at once, so that I can upload a field batch efficiently.
3. As an NGO project coordinator, I want to see upload and analysis progress per asset, so that I know what is happening.
4. As an NGO project coordinator, I want Cloudinary to analyze images and videos, so that I receive tags, captions, OCR, and video signals.
5. As an NGO project coordinator, I want to see the original asset and its source link for every result, so that claims are traceable.
6. As an NGO project coordinator, I want OpenRouter to suggest evidence groups and timeline events, so that I do not have to arrange everything manually.
7. As an NGO project coordinator, I want to edit or reject suggested tags and groups, so that the final record reflects field knowledge.
8. As an NGO project coordinator, I want low-confidence results highlighted for review, so that uncertain AI output is not presented as fact.
9. As an NGO project coordinator, I want to confirm before/after pairs, so that visible project change is shown accurately.
10. As an NGO project coordinator, I want a timeline of evidence moments, so that progress can be reviewed in order.
11. As an NGO project coordinator, I want a report containing a summary, timeline, evidence table, before/after section, recommendations, and source links, so that the project can be shared with reviewers.
12. As an NGO project coordinator, I want missing information marked as “Not enough evidence,” so that the report does not invent unsupported claims.
13. As an NGO project coordinator, I want to save projects in the browser, so that I can return to the demo without setting up a database.
14. As an NGO project coordinator, I want to support multiple saved projects, so that previous work remains visible.
15. As an NGO project coordinator, I want to use Cloudinary for media storage and transformations, so that the application uses the track sponsor's platform meaningfully.
16. As an NGO project coordinator, I want OpenRouter to receive compact metadata rather than raw media, so that requests remain efficient and within the daily limit.
17. As an NGO project coordinator, I want invalid AI output to fall back to manual review without repeated automatic retries, so that the request budget is protected.
18. As an NGO project coordinator, I want to print or save the report as PDF, so that I can share it without generating a separate document service.
19. As a reviewer, I want to see the project summary and strongest evidence immediately, so that I can understand the result quickly.
20. As a reviewer, I want to inspect the source of each claim, so that I can trust the impact story.

## Implementation Decisions

- Use Next.js as the application framework.
- Use Cloudinary for uploads, media delivery, transformations, and configured AI add-ons.
- Use Cloudinary AI Content Analysis for image understanding and captions.
- Use Google Automatic Video Tagging for short-video signals.
- Use Google Text Detection and Extraction for OCR where available.
- Use Google AI Video Transcription only when transcription is useful for the selected video.
- Use OpenRouter for exactly two calls per project: one grouping/timeline call and one report call.
- The grouping call receives only project metadata and Cloudinary-derived tags, captions, OCR, dates, confidence, and asset links.
- The grouping call returns strict JSON; the report call returns Markdown.
- Use one fast/cheap model for grouping and one stronger model for report generation, configured through environment variables.
- Store project and analysis data in browser localStorage for the MVP.
- Do not add PostgreSQL, authentication, user accounts, public sharing, or team collaboration yet.
- Limit a project to twelve media assets and accept images plus short videos.
- Do not automatically retry malformed OpenRouter output; show an error and allow manual continuation.
- Preserve original asset identity and source links separately from derived transformations and AI results.
- Mark unsupported claims as “Not enough evidence”.
- Use the highest-level behavior seam for testing: a project coordinator can complete the create-project, upload, review, and report journey.



## Testing Decisions

- Test externally observable behavior rather than internal component structure.
- Test project creation and localStorage persistence.
- Test multi-file selection and asset limits.
- Test upload progress and per-asset failure states.
- Test that Cloudinary responses preserve public IDs, secure URLs, and source links.
- Test that only compact metadata is sent to OpenRouter.
- Test valid grouping JSON, malformed grouping JSON, and missing-evidence responses.
- Test user confirmation and rejection of AI suggestions.
- Test before/after confirmation.
- Test report generation and print/PDF browser flow.
- Use mocked Cloudinary and OpenRouter boundaries for deterministic tests.
- Perform one real-service smoke test only when credentials are available; never require live services for the core test suite.

## Out of Scope

- PostgreSQL or another database
- Authentication and user accounts
- Public report sharing
- Multiple team members or permissions
- Payments or subscription handling
- Custom computer-vision model training
- Automatic legal or impact verification
- Broad social-media publishing
- Unrelated Marketplace add-ons
- Advanced analytics, maps, or IoT integrations

## Further Notes

The primary demo scenario is a tree-plantation project. Water conservation and infrastructure are secondary examples and should be represented through the same project workflow without expanding the MVP. The UI should prioritize the evidence trail, review state, and report over decorative features.

SPEC READY

- Status: ready for implementation
- Source: `.scratch/cloudinary-impact-mvp/spec.md`
- Repository: `C:\Users\vinay\Documents\AI\hackathon\codecubicle`
- Baseline: workspace before application scaffold
- Test seam: project-coordinator journey from project creation to report generation
- Non-goals: database, auth, sharing, custom CV, unrelated add-ons
- External authority: Cloudinary/OpenRouter/Vercel credentials and real-service permissions are not granted by the repository
- Next route: /to-tickets
