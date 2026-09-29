import { expect, test, type Page } from "@playwright/test";
import { stubOrganizer } from "./helpers/stub-ai";

async function createDemoProject(page: Page, name: string) {
  await page.goto("/");
  await page.getByLabel("Project name").fill(name);
  await page.getByRole("combobox", { name: "Category" }).click();
  await page.getByRole("option", { name: "Tree plantation" }).click();
  await page.getByLabel("Location").fill("Pune, Maharashtra");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-08-31");
  await page.getByLabel("Impact story").fill("A traceable field journal for community-led restoration.");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await page.getByRole("button", { name: "Load sample field journal" }).click();
}

test("coordinator receives editable evidence organization suggestions", async ({ page }) => {
  await stubOrganizer(page);
  await createDemoProject(page, "Organized Field Journal");
  await page.getByRole("button", { name: "2. Organize evidence" }).click();
  await page.getByRole("button", { name: "Organize evidence", exact: true }).click();

  await expect(page.getByText("Suggested evidence groups")).toBeVisible();
  await expect(page.getByText("Demo suggestions", { exact: true })).toBeVisible();
  await expect(page.getByText("Timeline suggestions")).toBeVisible();
  await expect(page.getByText("Before / after suggestions")).toBeVisible();
  await expect(page.getByRole("button", { name: "Review suggestions" })).toBeVisible();
  await expect(page.getByText("Raw model output")).toHaveCount(0);
});

test("invalid grouping output offers manual continuation without retry", async ({ page }) => {
  await createDemoProject(page, "Manual Continuation Journal");
  let requestCount = 0;
  await page.route("/api/evidence/group", async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "invalid_grouping_json",
          message: "The organizer returned incomplete suggestions.",
        },
      }),
    });
  });

  await page.getByRole("button", { name: "2. Organize evidence" }).click();
  await page.getByRole("button", { name: "Organize evidence", exact: true }).click();
  await expect(page.getByText("Organizer paused")).toBeVisible();
  await expect(page.getByText("no automatic retry was sent.")).toBeVisible();
  await page.getByRole("button", { name: "Continue manually" }).click();
  await expect(page.getByText("Manual continuation", { exact: true })).toBeVisible();
  expect(requestCount).toBe(1);
});
