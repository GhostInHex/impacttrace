import type { Page } from "@playwright/test";

/**
 * The e2e suite must never call the live OpenRouter API. OpenRouter is metered
 * (CONTEXT.md budgets 50 requests/day) and starts returning 429 once the budget
 * is spent, which fails these specs for reasons unrelated to the app.
 *
 * These stubs return the same shape the app's documented offline fallback
 * produces, so the specs keep asserting real UI behaviour and cost no quota.
 */

type GroupAsset = { id: string; filename: string; sourceUrl: string; caption: string; tags: string[]; confidence: number; kind: string };

export async function stubOrganizer(page: Page) {
  await page.route("**/api/evidence/group", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}");
    const assets: GroupAsset[] = body?.assets ?? [];
    const ids = assets.map((a) => a.id);
    const [first, second] = ids;
    const name = body?.project?.name ?? "this project";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        grouping: {
          source: "demo",
          createdAt: new Date(2026, 0, 1).toISOString(),
          evidenceGroups: [
            {
              id: "demo-group-1",
              title: "Tree planting and early care",
              summary: `A small set of field moments connected to ${name}.`,
              assetIds: ids.slice(0, 2),
              confidence: 0.86,
            },
            ...(ids.length > 2
              ? [{
                  id: "demo-group-2",
                  title: "Later growth and follow-up",
                  summary: "Later media suggests a follow-up visit, but a coordinator should confirm the sequence.",
                  assetIds: ids.slice(2, 4),
                  confidence: 0.62,
                }]
              : []),
          ],
          timeline: [
            {
              id: "demo-event-1",
              date: body?.project?.startDate ?? "2026-01-01",
              title: "Project field moment",
              description: `The first documented moment for ${name}.`,
              assetIds: ids.slice(0, 2),
              confidence: 0.78,
            },
            ...(ids.length > 2
              ? [{
                  id: "demo-event-2",
                  date: body?.project?.endDate ?? "2026-06-01",
                  title: "Follow-up field moment",
                  description: "A later media set is available for coordinator review.",
                  assetIds: ids.slice(2, 4),
                  confidence: 0.62,
                }]
              : []),
          ],
          beforeAfterPairs: first && second && first !== second
            ? [{
                id: "demo-pair-1",
                beforeAssetId: first,
                afterAssetId: second,
                caption: "Compare the first and second source assets to confirm visible change.",
                confidence: 0.58,
              }]
            : [],
        },
        notice: "Demo suggestions are shown because OpenRouter is not configured.",
      }),
    });
  });
}

export async function stubReport(page: Page) {
  const counter = { count: 0 };
  await page.route("**/api/report/generate", async (route) => {
    counter.count += 1;
    const body = JSON.parse(route.request().postData() ?? "{}");
    const assets: GroupAsset[] = body?.assets ?? [];
    const name = body?.project?.name ?? "this project";
    const hasEvidence = assets.length > 0;

    const table = assets.length
      ? [
          "| Source | Media | Caption | Tags | Confidence |",
          "| --- | --- | --- | --- | --- |",
          ...assets.map(
            (a) =>
              `| [${a.filename}](${a.sourceUrl}) | ${a.kind} | ${a.caption || "Not enough evidence"} | ${a.tags.join(", ") || "Not enough evidence"} | ${Math.round(a.confidence * 100)}% |`,
          ),
        ].join("\n")
      : "| Source | Media | Caption | Tags | Confidence |\n| --- | --- | --- | --- | --- |\n| Not enough evidence | — | — | — | — |";

    const markdown = `# Impact report: ${name}

## Summary
${hasEvidence
  ? `${name} is documented through ${assets.length} source ${assets.length === 1 ? "asset" : "assets"} in ${body?.project?.location ?? "the project area"}. The evidence below is limited to reviewed metadata and should be read with its confidence notes.`
  : `Not enough evidence is currently confirmed for ${name}. Add and review source media before drawing impact conclusions.`}

## Timeline
Not enough evidence

## Evidence table
${table}

## Before / after
Not enough evidence for a valid before / after pair.

## Recommendations
- Keep collecting source media for low-confidence moments.
- Confirm dates and visible change before using the evidence in a funder update.

## Source links
${assets.length
  ? assets.map((a) => `- [${a.filename}](${a.sourceUrl}) — ${a.kind}, ${Math.round(a.confidence * 100)}% analysis confidence.`).join("\n")
  : "Not enough evidence"}`;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        report: { markdown, generatedAt: new Date(2026, 0, 1).toISOString(), source: "demo" },
        notice: "A local Markdown report is shown because OpenRouter is not configured.",
      }),
    });
  });

  return counter;
}
