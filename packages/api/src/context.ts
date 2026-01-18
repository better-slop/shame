import { auth } from "@bs-shame/auth";
import { auth } from "@bs-shame/auth";
import { env } from "@bs-shame/env/server";
import { getTestSessionFromHeaders } from "./test-session";

type RequestContext = {
  req: {
    raw: {
      headers: Headers;
    };
  };
};

export type CreateContextOptions = {
  context: RequestContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const headers = context.req.raw.headers;
  const testSession = await getTestSessionFromHeaders(headers, env.STAGE);
  const session = testSession
    ? testSession
    : await auth.api.getSession({
        headers,
      });
  return {
    session,
    env: {
      REPORT_WORKFLOW: env.REPORT_WORKFLOW,
      ENFORCEMENT_WORKFLOW: env.ENFORCEMENT_WORKFLOW,
      WORKFLOW_RUNS: env.WORKFLOW_RUNS,
    },
  };
}

export type WorkflowBindings = {
  REPORT_WORKFLOW: Workflow<{
    githubUrl: string;
    installationId: number;
    reporterAccountId: number;
  }>;
  ENFORCEMENT_WORKFLOW: Workflow<{ repoFullName: string; actorLogin: string; token: string }>;
  WORKFLOW_RUNS: KVNamespace;
};

export type Context = Awaited<ReturnType<typeof createContext>> & {
  env: WorkflowBindings;
};
