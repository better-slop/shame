import { expect, test } from "@playwright/test";

const testUser = process.env.PLAYWRIGHT_TEST_USER ?? "e2e";

const baseInstallationId = Number(process.env.PLAYWRIGHT_INSTALLATION_ID ?? 4200);
const baseRepoName = process.env.PLAYWRIGHT_REPO_NAME ?? `${testUser}/test-repo`;

test("scope picker selects installation and repo", async ({ page }: { page: any }) => {
  await page.addInitScript((handle: string) => {
    (globalThis as typeof globalThis & { __BS_SHAME_TEST_USER__?: string }).__BS_SHAME_TEST_USER__ =
      handle;
  }, testUser);

  await page.goto(`/dashboard?installationId=${baseInstallationId}`);

  await expect(page.getByTestId("scope-picker")).toBeVisible();
  await expect(page.getByTestId("scope-installation")).toBeVisible();
  await expect(page.getByTestId("scope-repo")).toBeVisible();

  await page.getByTestId("scope-repo").click();
  await page.getByRole("option", { name: baseRepoName }).click();

  await expect(page).toHaveURL(/repoId=/);
  await expect(page.getByText(baseRepoName)).toBeVisible();
});
