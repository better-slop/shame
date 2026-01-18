import { expect, test } from "@playwright/test";

const testUser = process.env.PLAYWRIGHT_TEST_USER ?? "e2e";
const baseInstallationId = Number(process.env.PLAYWRIGHT_INSTALLATION_ID ?? 4200);
const baseRepoId = Number(process.env.PLAYWRIGHT_REPO_ID ?? 9001);
const githubUrl =
  process.env.PLAYWRIGHT_GITHUB_URL ?? "https://github.com/octocat/Hello-World/issues/1347";

test("create report from GitHub URL", async ({ page }: { page: any }) => {
  await page.addInitScript((handle: string) => {
    (globalThis as typeof globalThis & { __BS_SHAME_TEST_USER__?: string }).__BS_SHAME_TEST_USER__ =
      handle;
  }, testUser);

  await page.goto(`/dashboard/reports/new?installationId=${baseInstallationId}&repoId=${baseRepoId}`);

  await page.getByLabel("GitHub URL").fill(githubUrl);
  await page.getByLabel("Reason").selectOption("ai_spam");
  await page.getByLabel("Additional Details (optional)").fill("Playwright test report");
  await page.getByLabel("Action").selectOption("flag");
  await page.getByRole("button", { name: "Submit Report" }).scrollIntoViewIfNeeded();

  await page.getByRole("button", { name: "Submit Report" }).click();

  await expect(page).toHaveURL(/\/dashboard\/reports/);
});
