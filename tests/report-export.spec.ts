import { expect, test, type Page } from "@playwright/test";
import { stubOrganizer, stubReport } from "./helpers/stub-ai";

async function createReportProject(page: Page) {
  await page.goto("/");
  await page.getByLabel("Project name").fill("Reportable Field Journal");
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
  await page.getByRole("button", { name: "Review suggestions" }).click();
  const rejectButtons = page.getByRole("button", { name: "Reject suggestion", exact: true });
  const rejectCount = await rejectButtons.count();
  for (let index = 0; index < rejectCount; index += 1) {
    await rejectButtons.nth(0).click();
  }
  await page.getByRole("button", { name: "4. Impact report" }).click();
}

test("coordinator generates one complete report and can print it", async ({ page }) => {
  await stubOrganizer(page);
  await createReportProject(page);
  // The stub counts the calls so the test can assert exactly one report request
  // is sent, without ever reaching the live metered OpenRouter API.
  const reportRequests = await stubReport(page);

  await page.getByRole("button", { name: "Generate report" }).click();
  await expect(page.getByTestId("impact-report")).toBeVisible();
  for (const heading of ["Summary", "Timeline", "Evidence table", "Before / after", "Recommendations", "Source links"]) {
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByTestId("impact-report").getByRole("link", { name: "tree-plantation-01.jpg" }).first()).toBeVisible();
  await expect(page.getByText("Not enough evidence", { exact: true }).first()).toBeVisible();
  expect(reportRequests.count).toBe(1);

  await page.evaluate(() => {
    (window as Window & { print: () => void }).print = () => {
      document.body.dataset.printCalled = "true";
    };
  });
  await page.getByRole("button", { name: "Print / save PDF" }).first().click();
  await expect(page.locator("body")).toHaveAttribute("data-print-called", "true");
});
