import { expect, test, type Page } from "@playwright/test";
import { stubOrganizer, stubReport } from "./helpers/stub-ai";

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasOverflow).toBe(false);
}

test("tree-plantation demo completes from one-click start to report", async ({ page }) => {
  await stubOrganizer(page);
  await stubReport(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(page.getByText("Start with a sample field journal")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Start Tree plantation demo" }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Canopy Commons" })).toBeVisible();
  await expect(page.getByText("8 / 12 assets")).toBeVisible();
  await expect(page.getByText("Transcript signal")).toBeVisible();

  await page.getByRole("button", { name: "2. Organize evidence" }).click();
  await page.getByRole("button", { name: "Organize evidence", exact: true }).click();
  await expect(page.getByText("Suggested evidence groups")).toBeVisible();
  await page.getByRole("button", { name: "Review suggestions" }).click();
  await page.getByRole("button", { name: "Continue to impact report" }).click();
  await page.getByRole("button", { name: "Generate report" }).click();
  await expect(page.getByTestId("impact-report")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Summary", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("water and infrastructure examples use the same project workflow", async ({ page }) => {
  await page.goto("/");
  for (const scenario of [
    { button: "Start Water conservation demo", heading: "Every Drop Counts" },
    { button: "Start Infrastructure demo", heading: "Safer Paths Home" },
  ]) {
    await page.getByRole("button", { name: scenario.button }).click();
    await expect(page.getByRole("heading", { name: scenario.heading })).toBeVisible();
    await expect(page.getByText("8 / 12 assets")).toBeVisible();
    await page.getByRole("link", { name: "All projects" }).click();
  }
});
