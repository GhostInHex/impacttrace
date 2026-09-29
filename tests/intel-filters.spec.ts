import { expect, test, type Page } from "@playwright/test";

/** Run one collection and wait for the rows to land. */
async function collect(page: Page, prompt: string) {
  await page.goto("/");
  await page.getByRole("tab", { name: /Data Intelligence/ }).click();
  await page.getByLabel("Data request prompt").fill(prompt);
  await page.getByRole("button", { name: "Run collection" }).click();
  await expect(page.getByText(/Showing \d+ of \d+/)).toBeVisible({ timeout: 90_000 });
}

function rowCount(page: Page) {
  return page.evaluate(() =>
    Math.max(
      document.querySelectorAll("table tbody tr").length,
      document.querySelectorAll("ul li").length,
    ),
  );
}

test("collected rows can be searched", async ({ page }) => {
  await collect(page, "remote data engineering roles in Europe");
  const total = await rowCount(page);
  expect(total).toBeGreaterThan(0);

  await page.getByLabel("Search collected rows").fill("take-home");
  const filtered = await rowCount(page);
  expect(filtered).toBeLessThan(total);
  expect(filtered).toBeGreaterThan(0);

  await expect(page.getByText(`Showing ${filtered} of ${total}`)).toBeVisible();
});

test("rows can be filtered by remote availability", async ({ page }) => {
  await collect(page, "engineering roles in Europe");
  const total = await rowCount(page);

  await page.getByLabel("Remote only").check();
  const remoteOnly = await rowCount(page);
  expect(remoteOnly).toBeLessThanOrEqual(total);
  await expect(page.getByText(`Showing ${remoteOnly} of ${total}`)).toBeVisible();
});

test("filters can be cleared from the empty state", async ({ page }) => {
  await collect(page, "engineering roles in Europe");
  const total = await rowCount(page);

  await page.getByLabel("Search collected rows").fill("zzzznotathing");
  await expect(page.getByText("No rows match these filters")).toBeVisible();

  await page.getByRole("button", { name: "Clear filters" }).last().click();
  await expect(page.getByText("No rows match these filters")).toBeHidden();
  expect(await rowCount(page)).toBe(total);
});

test("rows can be sorted by company", async ({ page }) => {
  await collect(page, "engineering roles in Europe");

  await page.getByLabel("Sort rows").selectOption("company");
  const first = page.locator("table tbody tr td").first();
  await expect(first).toBeVisible();

  const names: string[] = [];
  const cells = page.locator("table tbody tr td:first-child");
  const n = await cells.count();
  for (let i = 0; i < n; i++) names.push((await cells.nth(i).textContent()) ?? "");

  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  expect(names).toEqual(sorted);
});

test("the dataset stays readable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await collect(page, "engineering roles in Europe");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);

  await page.getByLabel("Search collected rows").fill("remote");
  expect(await rowCount(page)).toBeGreaterThan(0);
});
