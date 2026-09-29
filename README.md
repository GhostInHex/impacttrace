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
| `OPENROUTER_GROUP_MODEL` | No | Grouping and query-planning model. Defaults to `nvidia/nemotron-3-super-120b-a12b:free`. |
| `OPENROUTER_REPORT_MODEL` | No | Report-writing model. Defaults to `nvidia/nemotron-3-ultra-550b-a55b:free`. |
| `NEXT_PUBLIC_APP_URL` | No | Your site URL, sent as `HTTP-Referer` + shown as `X-Title` for OpenRouter rankings. Optional, not auth. |

Keep all provider secrets server-side. The browser only calls the local route handlers under `src/app/api`; it never receives Cloudinary or OpenRouter credentials.

## Cloudinary setup

Create a Cloudinary account and enable the add-ons. Cloudinary gives every account free tiers of the AI add-ons; the parameters below were verified against a live account.

**Images** request three add-ons at once:

| Parameter | Add-on | Returns |
| --- | --- | --- |
| `categorization=aws_rek_tagging` | Rekognition Auto Tagging | `info.categorization.aws_rek_tagging.data[]` of `{tag, confidence}` |
| `detection=captioning` | Cloudinary AI Content Analysis | `info.detection.captioning.data.caption` |
| `ocr=adv_ocr` | Google OCR Text Detection | `info.ocr.adv_ocr.data[].textAnnotations[].description` |

**Videos** request `auto_tagging=0.6` and `categorization=google_video_tagging`. Video tagging is asynchronous: the upload returns `status: "pending"` and the route surfaces "Cloudinary is still analysing this video" rather than claiming no tags were found.

Do not send a `transcription` parameter on upload. It is not accepted, and including it makes Cloudinary reject the signature, which fails the whole video upload. Transcribe a stored asset in a follow-up request instead.

Do not use `categorization=google_tagging`. Google Automatic Video Tagging is video-only, so on an image Cloudinary rejects it with `420`, which fails the entire upload rather than degrading.

The route nests add-on results under `info`, and the mean tag confidence becomes the asset confidence so a weak result still routes into review. The source URL and public ID remain visible in the field journal and report.

**If an add-on is unavailable, the upload still succeeds.** Cloudinary answers `420` for an unsubscribed add-on, so the route retries once without the optional parameters and returns `aiAnalysisAvailable: false`. The card then explains the asset is stored but unanalyzed, rather than showing an empty result that looks like a model failure.

## OpenRouter setup

Set `OPENROUTER_API_KEY` and choose separate grouping and report models. The grouping route makes one request with compact project metadata and Cloudinary-derived fields only. It never receives raw media bytes. If the model returns invalid JSON, the UI explains the issue and offers manual continuation without automatically spending another request.

### Choosing a free model

Both the evidence grouper and the PS-01 query planner send `response_format: json_object`. Most free OpenRouter models **do not support that parameter** and return prose instead, which surfaces as an "invalid grouping" or "no rows" failure.

Measured against the live API with a JSON-mode request:

| Model | Result |
| --- | --- |
| `nvidia/nemotron-3-super-120b-a12b:free` | valid JSON, ~1.6s — **used for grouping and planning** |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | valid, ~2s, 1M context — **used for report writing** |
| `dots-studio/dots-3-note-preview:free` | valid JSON but ~43s |
| `inclusionai/ling-3.0-flash-sante:free` | 400 from provider |
| `qwen/qwen3.8-27b:free` | 429 rate limited |
| `thinkingmachines/inkling:free` | 403, agentic harnesses only |

Avoid `openrouter/free`. It picks a random free model per request, so the same call succeeds or fails unpredictably — which is what made the demo unrepeatable.

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
- The sample journal uses bundled Wikimedia Commons photographs, not Cloudinary uploads, so it demonstrates the workflow without spending upload calls. To exercise the Cloudinary path end to end, drop a real photo onto the upload area.
- Without OpenRouter credentials, the app uses labeled local demo suggestions and a deterministic Markdown report. This is useful for development but is not a substitute for provider-backed output. The PS-01 dataset is collected from its permitted source either way, because collection does not depend on the model.
- If the PS-01 source cannot be reached, the collection reports the failure and shows no rows rather than a fabricated dataset.
- A rate limit or provider error preserves the last valid report and offers a safe recovery path. Invalid JSON is never retried automatically.
- Browser localStorage is device-specific and can be cleared by the browser. Do not treat it as a production database.

## Demo media

The three sample scenarios load **real photographs** from Wikimedia Commons, downloaded into `public/demo/<category>/` at 1200px wide (about 5 MB for all 24).

- **Source:** Wikimedia Commons, filtered to files that are public domain, CC0, or CC BY, 900px+ wide.
- **Credits:** `public/demo/CREDITS.json` records the file title, author, licence, and Commons page for every image. Attribute before reuse.
- **Scenarios:** 8 images each for tree plantation, water conservation, and infrastructure, plus one video slot for the transcript-signal path.
- **Honest labelling:** these are illustrative stand-ins, not documentary evidence. Captions describe what the photograph shows; they are not claims about a real site.

`public/demo/_contact-sheet.html` renders all 24 images in a grid, which is the fastest way to review them.

For credible real-world evidence, replace them with media you have permission to use, avoid exposing personal information in OCR/transcript signals, and keep the original source accessible through Cloudinary.

## PS-01 data source

The Data Intelligence tab collects from a real, public, human-maintained dataset:

- **Source:** [`poteto/hiring-without-whiteboards`](https://github.com/poteto/hiring-without-whiteboards) — a list of ~755 companies that hire without whiteboard interviews.
- **How:** the API route fetches the repository README at request time and parses each `- [Company](careers-url) | Locations | Process` entry. The list is cached in memory for 10 minutes.
- **Why this source:** it is permitted, public, stable, and every row carries a **real, resolvable careers link** plus the company's actual interview process. Nothing in the dataset is generated.
- **Ranking:** the AI rewrites the natural-language request into a search query, then rows are scored on region match, remote availability, and whether a process is described.

If the source cannot be read, the collection returns an error and an empty result. It never substitutes invented rows, because fabricated source links would defeat the point of a traceable dataset.

## Project structure

- `src/features/media` — upload client boundary, media types, demo assets, and field journal UI
- `src/features/evidence` — compact grouping request, OpenRouter route, and organization UI
- `src/features/review` — persisted confirm/reject/edit workflow
- `src/features/report` — one-request Markdown generation and semantic report view
- `src/features/intel` — PS-01 query planning, the permitted-source collector, and local semantic memory
- `src/app/api` — server-only provider boundaries
- `docs/demo-journey.md` — short walkthrough and acceptance checklist

## Validation

```bash
npm run typecheck
npm run lint
npm run test:e2e
npm run build
```

