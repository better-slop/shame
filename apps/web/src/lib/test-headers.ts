export function getTestHeaders() {
  const testUser = (globalThis as typeof globalThis & { __BS_SHAME_TEST_USER__?: string })
    .__BS_SHAME_TEST_USER__;
  return {
    "x-test-user": testUser,
  } as const;
}
