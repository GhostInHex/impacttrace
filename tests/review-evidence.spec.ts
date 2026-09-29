import { expect, test, type Page } from "@playwright/test";
import { stubOrganizer } from "./helpers/stub-ai";

async function createOrganizedProject(page: Page, name: string) {
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
  await page.getByRole("button", { name: "2. Organize evidence" }).click();
  await page.getByRole("button", { name: "Organize evidence", exact: true }).click();
  await expect(page.getByText("Suggested evidence groups")).toBeVisible();
  await page.getByRole("button", { name: "Review suggestions" }).click();
}

test("coordinator can confirm, reject, and edit review suggestions", async ({ page }) => {
  await stubOrganizer(page);
  await createOrganizedProject(page, "Reviewable Field Journal");

  await expect(page.getByText("Review media tags")).toBeVisible();
  await expect(page.getByText("Evidence groups")).toBeVisible();
  await expect(page.getByText("Before / after selections")).toBeVisible();
  await expect(page.getByText("Review needed").first()).toBeVisible();

  await page.getByRole("button", { name: "Confirm suggestion", exact: true }).first().click();
  await expect(page.getByText("Confirmed").first()).toBeVisible();
  await page.getByRole("button", { name: "Reject suggestion", exact: true }).first().click();
  await expect(page.getByText("Rejected").first()).toBeVisible();

  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  const titleInput = page.getByLabel("Group title");
  await titleInput.fill("Confirmed planting moment");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Confirmed planting moment")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "3. Review & timeline" }).click();
  await expect(page.getByText("Confirmed planting moment")).toBeVisible();
  await expect(page.getByText("Confirmed").first()).toBeVisible();
});

