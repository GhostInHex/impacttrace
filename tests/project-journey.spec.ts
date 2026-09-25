import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
}

test("coordinator creates, refreshes, and reopens a saved project", async ({
  page,
}) => {
  const browserProblems: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      browserProblems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserProblems.push(`pageerror: ${error.message}`));

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Start a project" }),
  ).toBeVisible();
  await expect(page.getByText("No saved projects yet")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByText("Project name is required")).toBeVisible();
  await expect(page.getByText("Choose a project category")).toBeVisible();
  await expect(page.getByText("Location is required")).toBeVisible();
  await expect(page.getByText("Start date is required")).toBeVisible();
  await expect(page.getByText("End date is required")).toBeVisible();
  await expect(page.getByText("Impact story is required")).toBeVisible();

  await page.getByLabel("Project name").fill("Mangrove Recovery");
  await page.getByRole("combobox", { name: "Category" }).click();
  await page.getByRole("option", { name: "Tree plantation" }).click();
  await page.getByLabel("Location").fill("Pune, Maharashtra");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-06-30");
  await page
    .getByLabel("Impact story")
    .fill("Restore coastal mangroves with community-led planting and monitoring.");

  await page.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.getByText("End date must be on or after the start date"),
  ).toBeVisible();

  await page.getByLabel("End date").fill("2026-08-31");
  await page.getByRole("button", { name: "Save project" }).click();

  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await expect(
    page.getByRole("heading", { name: "Mangrove Recovery" }),
  ).toBeVisible();
  await expect(page.getByText("Pune, Maharashtra")).toBeVisible();

  await page.getByRole("link", { name: "All projects" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Mangrove Recovery")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saved projects" }),
  ).toBeVisible();
  await expect(page.getByText("Mangrove Recovery")).toBeVisible();

  await page.getByRole("link", { name: /Open Mangrove Recovery/ }).click();
  await expect(
    page.getByRole("heading", { name: "Mangrove Recovery" }),
  ).toBeVisible();

  await expectNoHorizontalOverflow(page);
  expect(browserProblems).toEqual([]);
});
