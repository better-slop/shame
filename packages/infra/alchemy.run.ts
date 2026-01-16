import alchemy from "alchemy";
import { D1Database, KVNamespace, TanStackStart, Worker, Workflow } from "alchemy/cloudflare";
import { GitHubSecret, RepositoryEnvironment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";
import { config } from "dotenv";

const stage = process.env.STAGE ?? process.env.USER;

// Load stage-specific env first (higher priority), then base .env
if (stage === "dev" || stage === "prod") {
  config({ path: `./.env.${stage}` });
}
config({ path: "./.env" });

const requireValue = <T>(value: T | undefined, name: string): T => {
  if (value === undefined) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
};

const app = await alchemy("bs-shame", {
  stage,
  stateStore: process.env.CI ? (scope) => new CloudflareStateStore(scope) : undefined,
});
const isProd = stage === "prod";
const isDev = stage === "dev";

// Domain configuration per stage
const webDomain = isProd ? "shame.bot" : isDev ? "dev.shame.bot" : undefined;
const apiDomain = isProd ? "api.shame.bot" : isDev ? "api-dev.shame.bot" : undefined;

// URLs for bindings
const webUrl = webDomain ? `https://${webDomain}` : undefined;
const apiUrl = apiDomain ? `https://${apiDomain}` : undefined;

const corsOrigin = webUrl ?? requireValue(alchemy.env.CORS_ORIGIN, "CORS_ORIGIN");
const betterAuthUrl = apiUrl ?? requireValue(alchemy.env.BETTER_AUTH_URL, "BETTER_AUTH_URL");
const viteServerUrl = apiUrl ?? requireValue(alchemy.env.VITE_SERVER_URL, "VITE_SERVER_URL");
const betterAuthSecret = requireValue(alchemy.secret.env.BETTER_AUTH_SECRET, "BETTER_AUTH_SECRET");
const githubClientId = requireValue(alchemy.env.GITHUB_CLIENT_ID, "GITHUB_CLIENT_ID");
const githubClientSecret = requireValue(
  alchemy.secret.env.GITHUB_CLIENT_SECRET,
  "GITHUB_CLIENT_SECRET",
);
const alchemyPassword = requireValue(alchemy.secret.env.ALCHEMY_PASSWORD, "ALCHEMY_PASSWORD");
const alchemyStateToken = requireValue(
  alchemy.secret.env.ALCHEMY_STATE_TOKEN,
  "ALCHEMY_STATE_TOKEN",
);
// Optional: GITHUB_WEBHOOK_SECRET (webhook handler has fallback if not set)
const githubWebhookSecret = process.env.GITHUB_WEBHOOK_SECRET
  ? alchemy.secret.env.GITHUB_WEBHOOK_SECRET
  : undefined;
if (!githubWebhookSecret) {
  console.warn("GITHUB_WEBHOOK_SECRET not set - webhook signature verification will be disabled");
}

const githubAppIdValue = process.env.GITHUB_APP_ID;
const githubAppPrivateKeyValue = process.env.GITHUB_APP_PRIVATE_KEY;
const hasGithubAppConfig = Boolean(githubAppIdValue && githubAppPrivateKeyValue);

const githubAppId = hasGithubAppConfig ? githubAppIdValue : undefined;
const githubAppPrivateKey = hasGithubAppConfig
  ? alchemy.secret(githubAppPrivateKeyValue)
  : undefined;

if (!hasGithubAppConfig && (githubAppIdValue || githubAppPrivateKeyValue)) {
  console.warn("GITHUB_APP_ID/GITHUB_APP_PRIVATE_KEY not both set - GitHub App features disabled");
}

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
  adopt: true,
});

const githubCache = await KVNamespace("github-cache", {
  title: `github-cache-${stage ?? "local"}`,
});

const reportWorkflow = Workflow("report-workflow", {
  className: "ReportWorkflow",
  workflowName: "report-workflow",
});

const enforcementWorkflow = Workflow("enforcement-workflow", {
  className: "EnforcementWorkflow",
  workflowName: "enforcement-workflow",
});

export const web = await TanStackStart("web", {
  cwd: "../../apps/web",
  adopt: true,
  domains: webDomain ? [webDomain] : undefined,
  bindings: {
    VITE_SERVER_URL: viteServerUrl,
    DB: db,
    CORS_ORIGIN: corsOrigin,
    BETTER_AUTH_SECRET: betterAuthSecret,
    BETTER_AUTH_URL: betterAuthUrl,
  },
});

export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  adopt: true,
  domains: apiDomain ? [apiDomain] : undefined,
  bindings: {
    DB: db,
    CORS_ORIGIN: corsOrigin,
    BETTER_AUTH_SECRET: betterAuthSecret,
    BETTER_AUTH_URL: betterAuthUrl,
    GITHUB_CLIENT_ID: githubClientId,
    GITHUB_CLIENT_SECRET: githubClientSecret,
    GITHUB_CACHE: githubCache,
    REPORT_WORKFLOW: reportWorkflow,
    ENFORCEMENT_WORKFLOW: enforcementWorkflow,
    ...(githubWebhookSecret && { GITHUB_WEBHOOK_SECRET: githubWebhookSecret }),
    ...(githubAppId && { GITHUB_APP_ID: githubAppId }),
    ...(githubAppPrivateKey && { GITHUB_APP_PRIVATE_KEY: githubAppPrivateKey }),
  },
  dev: {
    port: 3000,
  },
});

const docsDomain = isProd ? "docs.shame.bot" : isDev ? "docs-dev.shame.bot" : undefined;

export const docs = await TanStackStart("docs", {
  cwd: "../../apps/fumadocs",
  adopt: true,
  domains: docsDomain ? [docsDomain] : undefined,
  bindings: {},
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);
console.log(`Docs   -> ${docs.url}`);

// GitHub automation (only for dev/prod stages)
if (isProd || isDev) {
  const owner = "better-slop";
  const repository = "shame";
  const envName = isProd ? "production" : "development";

  // Create GitHub environment
  await RepositoryEnvironment(`gh-env-${stage}`, {
    owner,
    repository,
    name: envName,
    deploymentBranchPolicy: isProd
      ? { protectedBranches: false, customBranchPolicies: true }
      : undefined,
  });

  // Create scoped Cloudflare API token for CI
  // Push secrets to GitHub environment
  // Using existing CLOUDFLARE_API_TOKEN instead of minting new AccountApiToken
  await GitHubSecret(`gh-secret-cf-token-${stage}`, {
    owner,
    repository,
    name: "CLOUDFLARE_API_TOKEN",
    value: alchemy.secret(process.env.CLOUDFLARE_API_TOKEN!),
    environment: envName,
  });

  await GitHubSecret(`gh-secret-alchemy-password-${stage}`, {
    owner,
    repository,
    name: "ALCHEMY_PASSWORD",
    value: alchemyPassword,
    environment: envName,
  });

  await GitHubSecret(`gh-secret-alchemy-state-token-${stage}`, {
    owner,
    repository,
    name: "ALCHEMY_STATE_TOKEN",
    value: alchemyStateToken,
    environment: envName,
  });

  await GitHubSecret(`gh-secret-better-auth-${stage}`, {
    owner,
    repository,
    name: "BETTER_AUTH_SECRET",
    value: betterAuthSecret,
    environment: envName,
  });

  await GitHubSecret(`gh-secret-gh-client-secret-${stage}`, {
    owner,
    repository,
    name: "GH_CLIENT_SECRET",
    value: alchemy.secret(process.env.GITHUB_CLIENT_SECRET!),
    environment: envName,
  });

  console.log(`GitHub environment '${envName}' configured with secrets`);
}

await app.finalize();
