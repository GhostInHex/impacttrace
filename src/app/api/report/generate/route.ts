import { NextResponse } from "next/server";
import type { ReportRequest } from "@/features/report/report";
import { recordRateLimit, recordSuccess } from "@/lib/provider-status";

export const runtime = "nodejs";

/**
 * Verified against the live OpenRouter API: this free model answers in ~2s with
 * a 1M-token context window, which suits a long evidence-bound report. The
 * report is Markdown, so it does not need JSON mode.
 */
const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
const FALLBACK_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const OPENROUTER_TIMEOUT_MS = 60_000;

const requiredSections = [
  "## Summary",
  "## Timeline",
  "## Evidence table",
  "## Before / after",
  "## Recommendations",
  "## Source links",
];

function getModelContent(value: unknown) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";

  return value
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) {
        return typeof part.text === "string" ? part.text : "";
      }
      return "";
    })
    .join("");
}

function escapeCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function getAssetName(request: ReportRequest, assetId: string) {
  return request.assets.find((asset) => asset.id === assetId)?.filename ?? "Source asset";
}

function buildLocalReport(request: ReportRequest) {
  const hasEvidence = request.evidenceGroups.length > 0 || request.timeline.length > 0;
  const summary = hasEvidence
    ? `${request.project.name} is documented through ${request.assets.length} source ${request.assets.length === 1 ? "asset" : "assets"} in ${request.project.location}. The evidence below is limited to reviewed metadata and should be read with its confidence notes.`
    : `Not enough evidence is currently confirmed for ${request.project.name}. Add and review source media before drawing impact conclusions.`;
  const timeline = request.timeline.length
    ? request.timeline
        .map((event) => `- **${event.date} — ${event.title}**: ${event.description} (${Math.round(event.confidence * 100)}% confidence; ${event.reviewStatus})`)
        .join("\n")
    : "Not enough evidence";
  const evidenceTable = request.assets.length
    ? [
        "| Source | Media | Caption | Tags | Confidence |",
        "| --- | --- | --- | --- | --- |",
        ...request.assets.map(
          (asset) =>
            `| [${escapeCell(asset.filename)}](${asset.sourceUrl}) | ${asset.kind} | ${escapeCell(asset.caption || "Not enough evidence")} | ${escapeCell(asset.tags.join(", ") || "Not enough evidence")} | ${Math.round(asset.confidence * 100)}% |`,
        ),
      ].join("\n")
    : "| Source | Media | Caption | Tags | Confidence |\n| --- | --- | --- | --- | --- |\n| Not enough evidence | — | — | — | — |";
  const beforeAfter = request.beforeAfterPairs.length
    ? request.beforeAfterPairs
        .map(
          (pair) =>
            `- **${getAssetName(request, pair.beforeAssetId)} → ${getAssetName(request, pair.afterAssetId)}**: ${pair.caption} (${Math.round(pair.confidence * 100)}% confidence; ${pair.reviewStatus})`,
        )
        .join("\n")
    : "Not enough evidence for a valid before / after pair.";
  const recommendations = hasEvidence
    ? "- Keep collecting source media for low-confidence moments.\n- Confirm dates and visible change before using the evidence in a funder update.\n- Preserve the original source links when sharing this report."
    : "- Add more source media and organize it into an evidence moment.\n- Review the resulting suggestions before generating another report.";
  const sourceLinks = request.assets.length
    ? request.assets.map((asset) => `- [${asset.filename}](${asset.sourceUrl}) — ${asset.kind}, ${Math.round(asset.confidence * 100)}% analysis confidence.`).join("\n")
    : "Not enough evidence";

  return `# Impact report: ${request.project.name}

## Summary
${summary}

## Timeline
${timeline}

## Evidence table
${evidenceTable}

## Before / after
${beforeAfter}

## Recommendations
${recommendations}

## Source links
${sourceLinks}`;
}

function getErrorCode(status: number) {
  if (status === 401 || status === 403) return "openrouter_auth_failed";
  if (status === 429) return "openrouter_rate_limited";
  return "openrouter_unavailable";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ReportRequest | null;

  if (!body?.project || !Array.isArray(body.assets) || !Array.isArray(body.evidenceGroups) || !Array.isArray(body.timeline) || !Array.isArray(body.beforeAfterPairs)) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_report_input",
          message: "Review the project evidence before generating a report.",
        },
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      report: {
        markdown: buildLocalReport(body),
        generatedAt: new Date().toISOString(),
        source: "demo",
      },
      notice: "A local Markdown report is shown because OpenRouter is not configured.",
    });
  }

  const configured = process.env.OPENROUTER_REPORT_MODEL;
  // The free pool intermittently returns HTTP 200 with an empty completion, so
  // a second model is tried once before surfacing an error.
  const models = Array.from(
    new Set([configured ?? DEFAULT_MODEL, configured ? FALLBACK_MODEL : DEFAULT_MODEL]),
  );
  const systemPrompt = `You write concise, evidence-bound impact reports in Markdown. Use exactly these headings: ${requiredSections.join(", ")}. Never invent outcomes, dates, locations, or evidence. If a section has no reviewed evidence, write "Not enough evidence". Treat suggested items as uncertain, and never expose provider errors or raw model output.`;

  let content = "";
  let lastFailure: "network" | "http" | "empty" = "empty";
  let httpStatus = 502;

  for (const model of models) {
    let response: Response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          "X-Title": "Code Cubicle Impact Report",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(body) },
          ],
        }),
        signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
      });
    } catch {
      // A timeout or network blip may still be served by the other model.
      lastFailure = "network";
      continue;
    }

    if (!response.ok) {
      // An auth failure is account-wide and will not improve on the other
      // model; a rate limit or transient error might.
      lastFailure = "http";
      httpStatus = response.status;
      if (httpStatus === 429) recordRateLimit(model);
      if (httpStatus === 401 || httpStatus === 403) break;
      continue;
    }

    const payload = (await response.json().catch(() => null)) as
      | { choices?: Array<{ message?: { content?: unknown } }> }
      | null;

    content = getModelContent(payload?.choices?.[0]?.message?.content).trim();
    if (content) {
      recordSuccess(model);
      break;
    }
    lastFailure = "empty";
  }

  if (!content) {
    if (lastFailure === "network") {
      return NextResponse.json(
        {
          error: {
            code: "openrouter_unavailable",
            message: "The report service could not be reached. Your previous report is safe; try again later.",
          },
        },
        { status: 502 },
      );
    }
    if (lastFailure === "http") {
      return NextResponse.json(
        {
          error: {
            code: getErrorCode(httpStatus),
            message:
              httpStatus === 429
                ? "The report service is rate limited. Your previous report is safe; try again later."
                : "The report service could not complete this request. Your previous report is safe; try again later.",
          },
        },
        { status: httpStatus },
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "empty_report",
          message: "The report service returned no report on either model. Your previous report is safe; no further request was sent.",
        },
      },
      { status: 502 },
    );
  }

  const missingSections = requiredSections.filter((section) => !content.includes(section));
  const markdown = [
    content,
    ...missingSections.map((section) => `${section}\n\nNot enough evidence`),
  ].join("\n\n");

  return NextResponse.json({
    report: {
      markdown,
      generatedAt: new Date().toISOString(),
      source: "openrouter",
    },
  });
}

