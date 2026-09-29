import { NextResponse } from "next/server";
import { demoPlan } from "@/features/intel/intel";
import { collectCompanies, getSourceStats } from "@/features/intel/sources";
import { recordRateLimit, recordSuccess } from "@/lib/provider-status";

export const runtime = "nodejs";

/**
 * Verified against the live OpenRouter API: these free models return valid
 * JSON for `response_format: json_object`. Most other `:free` ids do not,
 * which is what produced the "invalid_grouping_json" failures.
 */
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const FALLBACK_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
const OPENROUTER_TIMEOUT_MS = 25_000;

function getContent(v: unknown): string {
  if (typeof v === "string") return v;
  if (!Array.isArray(v)) return "";
  return v
    .map((p) => {
      if (typeof p === "string") return p;
      if (p && typeof p === "object" && "text" in p) return typeof p.text === "string" ? p.text : "";
      return "";
    })
    .join("");
}

function wantsRemote(query: string) {
  return /\bremote\b/i.test(query);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim() ?? "";
  if (!prompt) {
    return NextResponse.json(
      { error: { code: "empty_prompt", message: "Describe what data you need." } },
      { status: 400 },
    );
  }

  // The dataset comes from a real public source. Collect first so a provider
  // outage can never fabricate rows.
  let rows;
  let stats;
  try {
    [rows, stats] = await Promise.all([
      collectCompanies({ query: prompt, remoteOnly: wantsRemote(prompt) }),
      getSourceStats(),
    ]);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "source_unavailable",
          message:
            error instanceof Error
              ? `The permitted source could not be read: ${error.message}`
              : "The permitted source could not be read.",
        },
      },
      { status: 502 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const fallbackPlan = demoPlan(prompt);

  if (!apiKey) {
    return NextResponse.json({
      plan: fallbackPlan,
      rows,
      notice: `Collected ${rows.length} rows from hiring-without-whiteboards. No OpenRouter key, so the query was not interpreted by AI.`,
    });
  }

  const configured = process.env.OPENROUTER_GROUP_MODEL;
  // The free pool intermittently returns HTTP 200 with an empty completion, so
  // a second model is tried once before falling back to the literal prompt.
  const models = Array.from(
    new Set([configured ?? DEFAULT_MODEL, configured ? FALLBACK_MODEL : DEFAULT_MODEL]),
  );
  const plannerSystem = `You turn a business data request into a search query for a public list of companies that hire without whiteboard interviews. Return one JSON object only: {topic, query, remoteOnly}. Set remoteOnly to true only when the request asks for remote work. Never invent company names.`;

  let plan = fallbackPlan;
  let planned = false;

  for (const model of models) {
    let response: Response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          "X-Title": "Code Cubicle Intel",
        },
        signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: plannerSystem },
            { role: "user", content: prompt },
          ],
        }),
      });
    } catch {
      // A timeout or network blip may still be served by the other model.
      continue;
    }

    if (!response.ok) {
      if (response.status === 429) recordRateLimit(model);
      continue;
    }

    const payload = (await response.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    } | null;

    const content = getContent(payload?.choices?.[0]?.message?.content).trim();
    if (!content) continue;

    try {
      const parsed = JSON.parse(content) as Partial<{
        topic: string;
        query: string;
        remoteOnly: boolean;
      }>;
      plan = {
        topic:
          typeof parsed.topic === "string" && parsed.topic
            ? parsed.topic.slice(0, 120)
            : fallbackPlan.topic,
        fields: ["company", "location", "interviewProcess", "sourceUrl"],
        sources: ["hiring-without-whiteboards (GitHub)"],
        query: typeof parsed.query === "string" && parsed.query ? parsed.query : prompt,
        source: "openrouter",
      };
      planned = true;
      recordSuccess(model);

      // Re-rank the real rows against the AI-written query.
      const refined = await collectCompanies({
        query: plan.query,
        remoteOnly:
          typeof parsed.remoteOnly === "boolean" ? parsed.remoteOnly : wantsRemote(prompt),
      });
      if (refined.length) rows = refined;
    } catch {
      continue;
    }

    break;
  }

  return NextResponse.json({
    plan,
    rows,
    stats,
    notice: planned
      ? `Collected ${rows.length} rows from hiring-without-whiteboards.`
      : `Collected ${rows.length} rows from hiring-without-whiteboards using the request as the search query.`,
  });
}
