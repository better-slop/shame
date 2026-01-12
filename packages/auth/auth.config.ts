// CLI-only config for better-auth schema generation
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const client = createClient({ url: "file:./temp.db" });
const db = drizzle({ client });

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  baseURL: "http://localhost:3000",
  secret: "placeholder-secret-for-cli-only",
});
