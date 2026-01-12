import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// Standalone config for better-auth CLI (no CF bindings needed)
export const auth = betterAuth({
  database: drizzleAdapter(undefined as never, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    github: {
      clientId: "placeholder",
      clientSecret: "placeholder",
    },
  },
  secret: "placeholder",
  baseURL: "http://localhost:3000",
});
