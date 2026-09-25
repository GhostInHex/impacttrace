import { expect, test, type Page } from "@playwright/test";

async function createProject(page: Page, name: string) {
  await page.goto("/");
  await page.getByLabel("Project name").fill(name);
  await page.getByRole("combobox", { name: "Category" }).click();
  await page.getByRole("option", { name: "Tree plantation" }).click();
  await page.getByLabel("Location").fill("Pune, Maharashtra");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-08-31");
  await page.getByLabel("Impact story").fill("A community-led field journal for a growing planting site.");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
}

test("coordinator can add a batch of media and keep the twelve-asset limit", async ({
  page,
}) => {
  await createProject(page, "Batch Field Journal");

  await page.locator("#media-upload-input").setInputFiles(
    Array.from({ length: 13 }, (_, index) => ({
      name: `field-${String(index + 1).padStart(2, "0")}.jpg`,
      mimeType: "image/jpeg",
      buffer: Buffer.from(`demo image ${index + 1}`),
    })),
  );

  await expect(page.getByText("12 / 12 assets")).toBeVisible();
  await expect(page.locator("[data-media-status]")).toHaveCount(12);
  await expect(page.getByText("Only 12 more assets can be added.")).toBeVisible();
  await expect(page.getByText("Source assets")).toBeVisible();
});

test("sample batch shows per-file media and video transcript signals", async ({
  page,
}) => {
  await createProject(page, "Sample Field Journal");
  await page.getByRole("button", { name: "Load sample field journal" }).click();

  await expect(page.getByText("8 / 12 assets")).toBeVisible();
  await expect(page.getByText("field-visit.mp4")).toBeVisible();
  await expect(page.getByText("Transcript signal")).toBeVisible();
  await expect(page.getByText("Review needed").first()).toBeVisible();
});

