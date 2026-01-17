import { auth } from "@bs-shame/auth";
import { env } from "@bs-shame/env/server";

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
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    session,
    env: {
      REPORT_WORKFLOW: env.REPORT_WORKFLOW,
      ENFORCEMENT_WORKFLOW: env.ENFORCEMENT_WORKFLOW,
    },
  };
}

export type WorkflowBindings = {
  REPORT_WORKFLOW: Workflow<{ githubUrl: string; installationId: number }>;
  ENFORCEMENT_WORKFLOW: Workflow<{ repoFullName: string; actorLogin: string; token: string }>;
};

export type Context = Awaited<ReturnType<typeof createContext>> & {
  env: WorkflowBindings;
};
