import { expect, test, type Page } from "@playwright/test";

async function createProject(page: Page, name: string) {
  await page.goto("/");
  await page.getByLabel("Project name").fill(name);
  await page.getByRole("combobox", { name: "Category" }).click();
  await page.getByRole("option", { name: "Tree plantation" }).click();
  await page.getByLabel("Location").fill("Pune, Maharashtra");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-08-31");
  await page.getByLabel("Impact story").fill("Restore a community planting site.");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await page.getByRole("link", { name: "All projects" }).click();
}

test("a project can be deleted after confirmation", async ({ page }) => {
  await createProject(page, "Deletable Field Journal");

  // Scoped to the saved-projects list; Next's route announcer repeats the name.
  const listed = page.getByRole("complementary").getByText("Deletable Field Journal");
  await expect(listed).toBeVisible();
  const deleteButton = page.getByRole("button", { name: "Delete Deletable Field Journal" });
  await expect(deleteButton).toBeVisible();

  // Cancelling must not destroy anything.
  await deleteButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Delete Deletable Field Journal?")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(listed).toBeVisible();

  // Confirming removes it and it stays removed across a refresh.
  await deleteButton.click();
  await page.getByRole("button", { name: "Delete project" }).click();
  await expect(listed).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByRole("complementary").getByText("Deletable Field Journal"),
  ).toHaveCount(0);
  await expect(page.getByText("No saved projects yet")).toBeVisible();
});

test("the confirmation dialog can be dismissed with Escape", async ({ page }) => {
  await createProject(page, "Escape Dismissed Journal");

  await page.getByRole("button", { name: "Delete Escape Dismissed Journal" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("complementary").getByText("Escape Dismissed Journal"),
  ).toBeVisible();
});

test("provider status is exposed for the demo banner", async ({ request }) => {
  const response = await request.get("/api/provider-status");
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(typeof body.rateLimited).toBe("boolean");
  expect(typeof body.retryInSeconds).toBe("number");
});
