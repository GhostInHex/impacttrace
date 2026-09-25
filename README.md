# Code Cubicle Impact Evidence MVP

Code Cubicle is a small Next.js workspace for turning field photos and short videos into traceable sustainability evidence. A coordinator can create a project, upload media, review AI suggestions, organize a timeline, and generate a Markdown impact report that can be printed or saved as a PDF.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app stores projects and review decisions in the current browser's `localStorage`; there is no authentication or database in this MVP.

You can also click **Start with a sample field journal** on the home screen. The tree-plantation, water-conservation, and infrastructure examples use the same workflow and load clearly labeled local SVG demo assets without requiring credentials.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values you want to use:

| Variable | Required | Purpose |
| --- | --- | --- |
| `CLOUDINARY_CLOUD_NAME` | For real uploads | Cloudinary account cloud name. |
| `CLOUDINARY_API_KEY` | For real uploads | Server-side Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | For real uploads | Server-side Cloudinary API secret. |
| `CLOUDINARY_UPLOAD_FOLDER` | No | Destination folder, defaults to `code-cubicle-impact`. |
| `OPENROUTER_API_KEY` | For real AI writing | Server-side key used for grouping and report requests. |
| `OPENROUTER_GROUP_MODEL` | No | Fast grouping model; the example uses a compact model. |
| `OPENROUTER_REPORT_MODEL` | No | Stronger report-writing model. |
| `NEXT_PUBLIC_APP_URL` | No | App URL used for OpenRouter attribution headers. |

Keep all provider secrets server-side. The browser only calls the local route handlers under `src/app/api`; it never receives Cloudinary or OpenRouter credentials.

## Cloudinary setup

Create a Cloudinary account and enable the add-ons used by the project media flow:

- AI Content Analysis / automatic image tagging
- Google Automatic Video Tagging for short videos
- Google Text Detection and Extraction for OCR
- Google AI Video Transcription for video transcript signals

The upload route sends the original file to the configured Cloudinary `auto/upload` endpoint and stores the returned `public_id`, `secure_url`, resource type, and available analysis signals. The source URL and public ID remain visible in the field journal and report.

## OpenRouter setup

Set `OPENROUTER_API_KEY` and choose separate grouping and report models. The grouping route makes one request with compact project metadata and Cloudinary-derived fields only. It never receives raw media bytes. If the model returns invalid JSON, the UI explains the issue and offers manual continuation without automatically spending another request.

The report route makes one report request from reviewed metadata. It requires these Markdown sections:

1. Summary
2. Timeline
3. Evidence table
4. Before / after
5. Recommendations
6. Source links

Missing or rejected evidence is written as **Not enough evidence** rather than invented.

## Demo journey

1. Create a project, or choose one of the three sample scenarios.
2. On the project page, add images/videos or load the sample field journal.
3. Review source previews, captions, tags, OCR/transcript signals, and confidence.
4. Select **Organize evidence**. Use the returned suggestions or continue manually.
5. Confirm, reject, reset, or edit tags, groups, timeline events, and before/after pairs.
6. Generate the impact report and use **Print / save PDF**.

The full path is documented in [`docs/demo-journey.md`](docs/demo-journey.md).

## Limits and recovery

- Maximum 12 assets per project.
- Practical file limit: 25 MB per media file.
- Accepted types: common images and short MP4, QuickTime, or WebM videos.
- Cloudinary analysis can be incomplete depending on account add-ons and media quality. Low confidence is a review cue, not a failure.
- Without Cloudinary credentials, selected files use a clearly labeled local preview analysis; use the sample journal for a deterministic demo.
- Without OpenRouter credentials, the app uses labeled local demo suggestions and a deterministic Markdown report. This is useful for development but is not a substitute for provider-backed output.
- A rate limit or provider error preserves the last valid report and offers a safe recovery path. Invalid JSON is never retried automatically.
- Browser localStorage is device-specific and can be cleared by the browser. Do not treat it as a production database.

## Media-source requirements

For credible real-world evidence, use media with permission from the people and places shown, avoid exposing personal information in OCR/transcript signals, and keep the original source accessible through Cloudinary. The bundled demo SVGs are illustrative placeholders, not documentary evidence. Replace them with credited field media before presenting results to funders or communities.

## Project structure

- `src/features/media` — upload client boundary, media types, demo assets, and field journal UI
- `src/features/evidence` — compact grouping request, OpenRouter route, and organization UI
- `src/features/review` — persisted confirm/reject/edit workflow
- `src/features/report` — one-request Markdown generation and semantic report view
- `src/app/api` — server-only provider boundaries
- `docs/demo-journey.md` — short walkthrough and acceptance checklist

## Validation

```bash
npm run typecheck
npm run lint
npm run test:e2e
npm run build
```

