import { expect, test } from "@playwright/test";

const testUser = process.env.PLAYWRIGHT_TEST_USER ?? "e2e";
const baseInstallationId = Number(process.env.PLAYWRIGHT_INSTALLATION_ID ?? 4200);

test("settings policy loads", async ({ page }: { page: any }) => {
  await page.addInitScript((handle: string) => {
    (globalThis as typeof globalThis & { __BS_SHAME_TEST_USER__?: string }).__BS_SHAME_TEST_USER__ =
      handle;
  }, testUser);

  await page.goto(`/dashboard/settings?installationId=${baseInstallationId}`);
  await expect(page.getByRole("heading", { name: "Policy Settings" })).toBeVisible();
});
