# Code Cubicle 6.0 — Cloudinary Impact Media Platform Context

## Product purpose

A Cloudinary-powered media intelligence product that helps an NGO project coordinator turn field photos and videos into organized, traceable impact evidence.

## Glossary

- **Project**: A sustainability initiative with a name, location, time period, and impact story.
- **Media asset**: An uploaded image or video belonging to a project.
- **Source asset**: The original uploaded media before any transformation, crop, annotation, or generated preview.
- **AI analysis**: Suggested tags, OCR text, activity, location or time signals, and confidence for a media asset.
- **Evidence**: A source asset plus its analysis and project context that supports a specific observation.
- **Evidence moment**: A dated or ordered group of media assets representing a project event or stage.
- **Before/after pair**: Two related assets selected to show visible change over time.
- **Impact report**: A review-ready summary of a project’s evidence moments, source links, AI findings, and confidence notes.
- **Demo media**: Clearly labeled sample or prototype media used before real field assets are available.

## Current product decisions

- The primary user is an NGO project coordinator.
- The primary workflow is: create/describe a project, upload media, review AI analysis, confirm evidence, and generate an impact report.
- Tree plantation is the primary demo scenario.
- Water conservation and infrastructure are secondary scenarios.
- The MVP uses real Cloudinary upload/media processing; AI analysis should be real where practical, with clearly labeled fallback/demo behavior only when necessary.
- The MVP must show a project timeline, source traceability, before/after comparison, and a generated impact report.
- Cloudinary AI handles media tags, OCR, and visual analysis; a separate LLM handles evidence grouping and report writing.
- The MVP includes photos plus one short video.
- Low-confidence results must be shown for user review before report generation.
- Every result shows the original/source asset link, AI analysis, and confidence.
- The report is available on screen and through browser print/save-as-PDF.
- The project uses 8–12 demo assets initially, with placeholders replaced by credited real media later.
- Cloudinary add-ons prepared for the MVP: AI Content Analysis, Google Automatic Video Tagging, Google Text Detection and Extraction, and Google AI Video Transcription.
- The AI pipeline uses Cloudinary for media analysis and OpenRouter for evidence grouping, timeline suggestions, and impact-report generation; the user confirms uncertain results before report generation.
- Use two OpenRouter models: a fast/cheap model for grouping and a stronger model for report writing.
- Send OpenRouter only project metadata and Cloudinary-derived tags, captions, OCR, dates, confidence, and asset links; do not send raw media.
- Optimize requests for the 50-request/day limit.
- Use two OpenRouter calls per project: one grouping call and one report call.
- OpenRouter returns JSON for grouping/timeline suggestions and Markdown for the report.
- Support multiple projects in browser localStorage; do not add user accounts or authentication to the MVP.
- If OpenRouter returns invalid grouping JSON, show an error and let the user continue manually; do not spend requests on automatic retries.
- Accept images and short videos, with a maximum of 12 assets and a practical per-file size limit.
- If evidence is missing, the report must say “Not enough evidence” rather than inventing details.
- The MVP is complete when it supports upload, media analysis, timeline, source links, user review, and report generation.
- The report includes summary, timeline, evidence table, before/after section, recommendations, and source links.
- The user reviews tags, evidence groups, timeline entries, and before/after pairs before generating the report.
- The real MVP will use Next.js.
- The first screen is project creation.
- The MVP stores project and analysis data in browser localStorage; hosted PostgreSQL may be added later.
