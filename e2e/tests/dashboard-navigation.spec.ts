import { expect, test } from "@playwright/test";

const testUser = process.env.PLAYWRIGHT_TEST_USER ?? "e2e";

const routes = [
  { name: "Overview", path: "/dashboard" },
  { name: "Reports", path: "/dashboard/reports" },
  { name: "Repos", path: "/dashboard/repos" },
  { name: "Settings", path: "/dashboard/settings" },
];

test("dashboard nav routes render", async ({ page }: { page: any }) => {
  await page.addInitScript((handle: string) => {
    (globalThis as typeof globalThis & { __BS_SHAME_TEST_USER__?: string }).__BS_SHAME_TEST_USER__ =
      handle;
  }, testUser);

  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.name })).toBeVisible();
  }
});
