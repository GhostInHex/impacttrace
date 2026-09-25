import { NextResponse } from "next/server";
import {
  createDemoGrouping,
  normalizeGrouping,
  type EvidenceGrouping,
} from "@/features/evidence/evidence";
import type { EvidenceRequest } from "@/features/evidence/evidence-request";

export const runtime = "nodejs";

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

  const model = process.env.OPENROUTER_GROUP_MODEL ?? "google/gemini-2.0-flash-001";
  const systemPrompt = `You organize sustainability field evidence. Return one JSON object only, with keys evidenceGroups, timeline, and beforeAfterPairs. Every item must use only the supplied asset IDs. Each item needs an id, concise title or caption, an assetIds array, and confidence from 0 to 1. Timeline items also need date and description. Do not invent dates, outcomes, or evidence.`;
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
          {
            role: "user",
            content: JSON.stringify(body),
          },
        ],
      }),
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "openrouter_unavailable",
          message: "OpenRouter could not be reached. Continue manually or try again later.",
        },
      },
      { status: 502 },
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | {
        choices?: Array<{ message?: { content?: unknown } }>;
        error?: { message?: string };
      }
    | null;

  if (!response.ok) {
    return NextResponse.json(
      {
        error: {
          code: getErrorCode(response.status),
          message:
            response.status === 429
              ? "OpenRouter is rate limited. Continue manually and try again later."
              : "OpenRouter could not organize this evidence. Continue manually or try again later.",
        },
      },
      { status: response.status },
    );
  }

  const content = getModelContent(payload?.choices?.[0]?.message?.content);
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "invalid_grouping_json",
          message: "The organizer returned incomplete suggestions. Continue manually; no retry was sent.",
        },
      },
      { status: 502 },
    );
  }

  const grouping = normalizeGrouping(parsed, body.assets.map((asset) => asset.id));

  if (!grouping) {
    return NextResponse.json(
      {
        error: {
          code: "empty_grouping",
          message: "No usable evidence suggestions were returned. Continue manually without a retry.",
        },
      },
      { status: 502 },
    );
  }

  const openRouterGrouping: EvidenceGrouping = {
    ...grouping,
    source: "openrouter",
  };

  return NextResponse.json({ grouping: openRouterGrouping });
}

