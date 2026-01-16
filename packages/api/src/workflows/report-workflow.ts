import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { z } from "zod";

import { createInstallationToken } from "../github/app";
import { getCachedJson, setCachedJson } from "../github/cache";
import { createGithubClient } from "../github/client";
import { parseGithubUrl } from "../github/parse-github-url";

type ReportWorkflowEnv = Env & {
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_CACHE: KVNamespace;
};

type ReportWorkflowParams = {
  githubUrl: string;
  installationId: number;
};

const issueSchema = z.object({
  id: z.number(),
  number: z.number(),
  user: z.object({
    id: z.number(),
    login: z.string(),
    type: z.string().optional(),
  }),
  pull_request: z
    .object({
      url: z.string().optional(),
    })
    .optional(),
  html_url: z.string(),
});

const repoSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  owner: z.object({
    id: z.number(),
    login: z.string(),
    type: z.string(),
  }),
});

export type ReportWorkflowOutput = {
  repo: z.infer<typeof repoSchema>;
  issue: z.infer<typeof issueSchema>;
};

export class ReportWorkflow extends WorkflowEntrypoint<ReportWorkflowEnv, ReportWorkflowParams> {
  async run(event: WorkflowEvent<ReportWorkflowParams>, step: WorkflowStep) {
    const parsed = parseGithubUrl(event.payload.githubUrl);
    if (!parsed) {
      throw new Error("Invalid GitHub URL");
    }

    const repoKey = `repo:${parsed.owner}/${parsed.repo}`.toLowerCase();
    const issueKey = `${parsed.kind}:${parsed.owner}/${parsed.repo}#${parsed.number}`.toLowerCase();

    const installationToken = await step.do("create installation token", async () =>
      createInstallationToken({
        installationId: event.payload.installationId,
        credentials: {
          appId: this.env.GITHUB_APP_ID,
          privateKey: this.env.GITHUB_APP_PRIVATE_KEY,
        },
      }),
    );

    const appClient = createGithubClient({ token: installationToken.token, type: "bearer" });

    const repo = await step.do("fetch repo", async () => {
      const cached = await getCachedJson(repoKey, repoSchema, this.env.GITHUB_CACHE);
      if (cached) return cached;
      const data = await appClient.request({
        method: "GET",
        path: `/repos/${parsed.owner}/${parsed.repo}`,
        schema: repoSchema,
      });
      await setCachedJson(repoKey, data, { ttlSeconds: 3600 }, this.env.GITHUB_CACHE);
      return data;
    });

    const issue = await step.do("fetch issue", async () => {
      const cached = await getCachedJson(issueKey, issueSchema, this.env.GITHUB_CACHE);
      if (cached) return cached;
      const data = await appClient.request({
        method: "GET",
        path: `/repos/${parsed.owner}/${parsed.repo}/issues/${parsed.number}`,
        schema: issueSchema,
      });
      await setCachedJson(issueKey, data, { ttlSeconds: 600 }, this.env.GITHUB_CACHE);
      return data;
    });

    return {
      repo,
      issue,
    } satisfies ReportWorkflowOutput;
  }
}
