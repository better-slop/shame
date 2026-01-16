import { createContext } from "@bs-shame/api/context";
import { appRouter } from "@bs-shame/api/routers/index";
import { EnforcementWorkflow, ReportWorkflow } from "@bs-shame/api/workflows";
import { auth } from "@bs-shame/auth";
import { env } from "@bs-shame/env/server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { githubWebhookHandler } from "./webhooks/github";

export { EnforcementWorkflow, ReportWorkflow };

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith("/api/auth/callback/")) {
    const state = c.req.query("state");
    const cookieHeader = c.req.header("cookie") ?? "";
    const origin = c.req.header("origin");
    const referer = c.req.header("referer");
    console.info("Auth callback request", {
      path: url.pathname,
      state,
      cookieHeader,
      origin,
      referer,
    });
  }

  return auth.handler(c.req.raw);
});

app.post("/github/webhook", githubWebhookHandler);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
