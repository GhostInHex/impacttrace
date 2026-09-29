import { expect, test } from "@playwright/test";

/**
 * PS-01 collection. The permitted source is a public GitHub repository, so this
 * exercises the real network path. Rows are only trusted if the source link is
 * present, which is the property the earlier fabricated fixture violated.
 */

const validRow = (row: Record<string, unknown>) => {
  expect(typeof row.company).toBe("string");
  expect((row.company as string).length).toBeGreaterThan(0);
  expect(String(row.sourceUrl)).toMatch(/^https?:\/\//);
  expect(String(row.sourceUrl)).not.toContain("example.com");
  expect(typeof row.confidence).toBe("number");
};

test("collection returns real, source-backed rows", async ({ request }) => {
  const response = await request.post("/api/intel/plan", {
    data: { prompt: "Find AI startup jobs in Bengaluru, remote ok" },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();

  expect(body.error).toBeUndefined();
  expect(body.notice).toBeTruthy();
  expect(Array.isArray(body.rows)).toBe(true);
  expect(body.rows.length).toBeGreaterThan(0);

  for (const row of body.rows) validRow(row);

  // Bengaluru or remote must actually influence the result set.
  const relevant = body.rows.filter(
    (row: Record<string, unknown>) =>
      /remote/i.test(String(row.location)) || /india|bengaluru|bangalore/i.test(String(row.location)),
  );
  expect(relevant.length).toBeGreaterThan(0);
});

test("a regional request narrows the dataset", async ({ request }) => {
  const response = await request.post("/api/intel/plan", {
    data: { prompt: "engineering roles in Tokyo" },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.rows.length).toBeGreaterThan(0);

  const tokyo = body.rows.filter((row: Record<string, unknown>) =>
    /tokyo/i.test(String(row.location)),
  );
  expect(tokyo.length).toBeGreaterThan(0);
});

test("an empty prompt is rejected without inventing rows", async ({ request }) => {
  const response = await request.post("/api/intel/plan", { data: { prompt: "   " } });

  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error.code).toBe("empty_prompt");
  expect(body.rows).toBeUndefined();
});
