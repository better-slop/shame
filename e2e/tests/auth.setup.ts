import { test as setup } from "@playwright/test";

const testUser = process.env.PLAYWRIGHT_TEST_USER ?? "e2e";

setup("seed test user", async ({ page }: { page: any }) => {
  await page.addInitScript((handle: string) => {
    (globalThis as typeof globalThis & { __BS_SHAME_TEST_USER__?: string }).__BS_SHAME_TEST_USER__ =
      handle;
  }, testUser);
});
