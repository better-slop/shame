import { env } from "@bs-shame/env/web";
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
  fetchOptions: {
    onRequest: (context) => {
      const testUser = (globalThis as typeof globalThis & { __BS_SHAME_TEST_USER__?: string })
        .__BS_SHAME_TEST_USER__;
      if (!testUser) {
        return context;
      }
      const headers = new Headers(context.headers);
      headers.set("x-test-user", testUser);
      return {
        ...context,
        headers,
      };
    },
  },
  plugins: [
    organizationClient(),
  ],
});
