import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { z } from "zod";

import { getCachedJson, setCachedJson } from "../github/cache";
import { createGithubClient } from "../github/client";

type EnforcementWorkflowEnv = Env & {
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_CACHE: KVNamespace;
};

type EnforcementWorkflowParams = {
  repoFullName: string;
  actorLogin: string;
  token: string;
};

const permissionsSchema = z.object({
  permission: z.string(),
});

export type EnforcementWorkflowOutput = {
  permission: z.infer<typeof permissionsSchema>;
};

export class EnforcementWorkflow extends WorkflowEntrypoint<
  EnforcementWorkflowEnv,
  EnforcementWorkflowParams
> {
  async run(event: WorkflowEvent<EnforcementWorkflowParams>, step: WorkflowStep) {
    const key = `perm:${event.payload.repoFullName}:${event.payload.actorLogin}`.toLowerCase();

    const permission = await step.do("permission check", async () => {
      const cached = await getCachedJson(key, permissionsSchema, this.env.GITHUB_CACHE);
      if (cached) return cached;

      const client = createGithubClient({ token: event.payload.token, type: "token" });
      const data = await client.request({
        method: "GET",
        path: `/repos/${event.payload.repoFullName}/collaborators/${event.payload.actorLogin}/permission`,
        schema: permissionsSchema,
      });
      await setCachedJson(key, data, { ttlSeconds: 120 }, this.env.GITHUB_CACHE);
      return data;
    });

    return { permission } satisfies EnforcementWorkflowOutput;
  }
}
