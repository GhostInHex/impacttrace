import { NextResponse } from "next/server";
import {
  createDemoGrouping,
  normalizeGrouping,
  type EvidenceGrouping,
} from "@/features/evidence/evidence";
import type { EvidenceRequest } from "@/features/evidence/evidence-request";
import { recordRateLimit, recordSuccess } from "@/lib/provider-status";

export const runtime = "nodejs";

/**
 * Free-tier models verified against the live API for `response_format:
 * json_object`. The free pool intermittently answers HTTP 200 with an EMPTY
 * completion, so a second model is tried once before giving up. This is a
 * fallback to a different model, not a retry of the same failing call.
 */
const PRIMARY_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const FALLBACK_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
// The free pool answers in ~2s most of the time but occasionally stalls past
// 25s, so the per-model budget is generous and the second model absorbs a
// timeout rather than the request failing outright.
const OPENROUTER_TIMEOUT_MS = 30_000;

type Attempt =
  | { kind: "ok"; grouping: EvidenceGrouping }
  | { kind: "empty" }
  | { kind: "unparseable" }
  | { kind: "unusable" }
  | { kind: "http"; status: number }
  | { kind: "network" };

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

function getErrorCode(status: number) {
  if (status === 401 || status === 403) return "openrouter_auth_failed";
  if (status === 429) return "openrouter_rate_limited";
  return "openrouter_unavailable";
}

const systemPrompt = `You organize sustainability field evidence. Return one JSON object only, with keys evidenceGroups, timeline, and beforeAfterPairs. Every item must use only the supplied asset IDs. Each item needs an id, concise title or caption, an assetIds array, and confidence from 0 to 1. Timeline items also need date and description. Do not invent dates, outcomes, or evidence.`;

async function attemptGrouping(
  model: string,
  apiKey: string,
  body: EvidenceRequest,
): Promise<Attempt> {
  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Code Cubicle Impact Evidence",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(body) },
        ],
      }),
      signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
    });
  } catch {
    return { kind: "network" };
  }

  if (!response.ok) return { kind: "http", status: response.status };

  const payload = (await response.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  } | null;

  const content = getModelContent(payload?.choices?.[0]?.message?.content).trim();
  if (!content) return { kind: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { kind: "unparseable" };
  }

  const grouping = normalizeGrouping(parsed, body.assets.map((asset) => asset.id));
  if (!grouping) return { kind: "unusable" };

  return { kind: "ok", grouping: { ...grouping, source: "openrouter" } };
}

function failure(attempt: Attempt) {
  if (attempt.kind === "http") {
    return {
      code: getErrorCode(attempt.status),
      message:
        attempt.status === 429
          ? "OpenRouter is rate limited. Continue manually and try again later."
          : "OpenRouter could not organize this evidence. Continue manually or try again later.",
      status: attempt.status,
    };
  }
  if (attempt.kind === "network") {
    return {
      code: "openrouter_unavailable",
      message: "OpenRouter could not be reached. Continue manually or try again later.",
      status: 502,
    };
  }
  return {
    code: attempt.kind === "unusable" ? "empty_grouping" : "invalid_grouping_json",
    message:
      attempt.kind === "unusable"
        ? "No usable evidence suggestions were returned. Continue manually without a retry."
        : "The organizer returned incomplete suggestions on both models. Continue manually; no further request was sent.",
    status: 502,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as EvidenceRequest | null;

  if (!body?.project || !Array.isArray(body.assets) || body.assets.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "no_media_metadata",
          message: "Add at least one ready media asset before organizing evidence.",
        },
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    const grouping = createDemoGrouping({
      projectName: body.project.name,
      category: body.project.category,
      assetIds: body.assets.map((asset) => asset.id),
      startDate: body.project.startDate,
      endDate: body.project.endDate,
    });

    return NextResponse.json({
      grouping,
      notice: "Demo suggestions are shown because OpenRouter is not configured.",
    });
  }

  const configured = process.env.OPENROUTER_GROUP_MODEL;
  const models = Array.from(
    new Set([configured ?? PRIMARY_MODEL, configured ? FALLBACK_MODEL : PRIMARY_MODEL]),
  );

  let last: Attempt = { kind: "empty" };
  for (const model of models) {
    last = await attemptGrouping(model, apiKey, body);
    if (last.kind === "ok") {
      recordSuccess(model);
      break;
    }
    if (last.kind === "http" && last.status === 429) recordRateLimit(model);
    // Only an auth failure is account-wide; a timeout, empty body, rate limit,
    // or network blip can all be served by the other model.
    if (last.kind === "http" && (last.status === 401 || last.status === 403)) break;
  }

  if (last.kind !== "ok") {
    const { code, message, status } = failure(last);
    return NextResponse.json({ error: { code, message } }, { status });
  }

  return NextResponse.json({ grouping: last.grouping });
}
