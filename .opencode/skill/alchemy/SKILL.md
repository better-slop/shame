---
name: alchemy
description: Alchemy IaC for Cloudflare - deploy Workers, D1, KV, Queues, Containers, and more with TypeScript-first infrastructure as code.
---

# Alchemy

Alchemy is a TypeScript-first infrastructure-as-code tool for deploying to Cloudflare (and many other cloud providers). Define your infrastructure in a `alchemy.run.ts` file.

## Quick Start

```ts
import alchemy from "alchemy";
import { Worker, KVNamespace, D1Database } from "alchemy/cloudflare";

const app = await alchemy("my-app");

const db = await D1Database("db", { name: "my-db" });
const cache = await KVNamespace("cache", { title: "my-cache" });

export const worker = await Worker("api", {
  entrypoint: "./src/worker.ts",
  bindings: { DB: db, CACHE: cache },
});

await app.finalize();
```

## Resources

| Resource               | Description                        | Reference                                                             |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Worker                 | Serverless functions at the edge   | [worker.md](references/worker.md)                                     |
| Workflow               | Long-running task orchestration    | [workflow.md](references/workflow.md)                                 |
| DurableObjectNamespace | Stateful serverless coordination   | [durable-object-namespace.md](references/durable-object-namespace.md) |
| D1Database             | Serverless SQL database            | [d1-database.md](references/d1-database.md)                           |
| D1StateStore           | State management with D1           | [d1-state-store.md](references/d1-state-store.md)                     |
| KVNamespace            | Key-value storage                  | [kv-namespace.md](references/kv-namespace.md)                         |
| Queue                  | Reliable message delivery          | [queue.md](references/queue.md)                                       |
| QueueConsumer          | Configure queue message processing | [queue-consumer.md](references/queue-consumer.md)                     |
| Container              | Docker containers on CF network    | [container.md](references/container.md)                               |
| Bucket                 | R2 object storage buckets          | [bucket.md](references/bucket.md)                                     |
| BucketObject           | R2 bucket objects                  | [bucket-object.md](references/bucket-object.md)                       |
| Assets                 | Static asset serving               | [assets.md](references/assets.md)                                     |
| Website                | Static website hosting             | [website.md](references/website.md)                                   |
| Route                  | URL pattern to Worker mapping      | [route.md](references/route.md)                                       |
| CustomDomain           | Attach domains to Workers          | [custom-domain.md](references/custom-domain.md)                       |
| Zone                   | DNS zone management                | [zone.md](references/zone.md)                                         |
| DnsRecords             | Manage DNS records                 | [dns-records.md](references/dns-records.md)                           |
| TanStackStart          | Deploy TanStack Start apps to CF   | [tanstack-start.md](references/tanstack-start.md)                     |
| Vite                   | Deploy Vite apps to CF             | [vite.md](references/vite.md)                                         |
| VersionMetadata        | Access worker version info         | [version-metadata.md](references/version-metadata.md)                 |
| Secret                 | Worker secrets management          | [secret.md](references/secret.md)                                     |
| SecretKey              | Cryptographic key generation       | [secret-key.md](references/secret-key.md)                             |
| SecretsStore           | Centralized secrets storage        | [secrets-store.md](references/secrets-store.md)                       |
| WranglerJson           | Generate wrangler.json from IaC    | [wrangler-json.md](references/wrangler-json.md)                       |
| AccountApiToken        | Create scoped API tokens           | [account-api-token.md](references/account-api-token.md)               |
| AccountId              | Retrieve account ID                | [account-id.md](references/account-id.md)                             |
| Logpush                | Export logs to destinations        | [logpush.md](references/logpush.md)                                   |
| AnalyticsEngine        | Write and query analytics data     | [analytics-engine.md](references/analytics-engine.md)                 |
| RateLimit              | Rate limiting rules                | [rate-limit.md](references/rate-limit.md)                             |
| RedirectRule           | URL redirect rules                 | [redirect-rule.md](references/redirect-rule.md)                       |

## GitHub Resources

| Resource              | Description                     | Reference                                                                     |
| --------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| GitHub                | GitHub provider overview        | [github.md](references/github.md)                                             |
| Comment               | Create PR/issue comments        | [github-comment.md](references/github-comment.md)                             |
| RepositoryEnvironment | Manage deployment environments  | [github-repository-environment.md](references/github-repository-environment.md) |
| RepositoryWebhook     | Configure repository webhooks   | [github-repository-webhook.md](references/github-repository-webhook.md)      |
| Secret                | Manage GitHub Actions secrets   | [github-secret.md](references/github-secret.md)                               |

## Concepts

| Concept       | Description                                | Reference                                           |
| ------------- | ------------------------------------------ | --------------------------------------------------- |
| Apps & Stages | Organize deployments by app and stage      | [apps-and-stages.md](references/apps-and-stages.md) |
| Resources     | Define and manage infrastructure resources | [resource.md](references/resource.md)               |
| Bindings      | Connect resources to Workers               | [bindings.md](references/bindings.md)               |
| Scope         | Resource lifecycle and hierarchy           | [scope.md](references/scope.md)                     |
| Secrets       | Manage sensitive configuration             | [secret.md](references/secret.md)                   |
| Profiles      | Environment-specific configuration         | [profiles.md](references/profiles.md)               |
| Dev Mode      | Local development (experimental)           | [dev.md](references/dev.md)                         |
| Testing       | Test your infrastructure                   | [testing.md](references/testing.md)                 |

## Guides

| Guide              | Description                           | Reference                                                                 |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------- |
| Cloudflare Setup   | Getting started with Cloudflare       | [cloudflare.md](references/cloudflare.md)                                 |
| CI/CD              | Continuous integration and deployment | [ci.md](references/ci.md)                                                 |
| Drizzle + D1       | Use Drizzle ORM with D1               | [drizzle-d1.md](references/drizzle-d1.md)                                 |
| Durable Objects    | Stateful coordination patterns        | [cloudflare-durable-objects.md](references/cloudflare-durable-objects.md) |
| Workflows          | Long-running task orchestration       | [cloudflare-workflows.md](references/cloudflare-workflows.md)             |
| LiveStore          | Real-time state with LiveStore        | [cloudflare-livestore.md](references/cloudflare-livestore.md)             |
| SQLite State Store | Local SQLite for state                | [sqlite-state-store.md](references/sqlite-state-store.md)                 |
| Turborepo          | Monorepo setup with Turborepo         | [turborepo.md](references/turborepo.md)                                   |
| Debugging          | Debug your deployments                | [debugging.md](references/debugging.md)                                   |
