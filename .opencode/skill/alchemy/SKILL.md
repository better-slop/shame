---
name: alchemy
description: Alchemy IaC for Cloudflare - deploy Workers, D1, KV, Queues, Containers, and more with TypeScript-first infrastructure as code.
---

# Alchemy

Alchemy is a TypeScript-first infrastructure-as-code tool for deploying to Cloudflare. Define your infrastructure in `alchemy.run.ts` and run with `bun ./alchemy.run.ts`.

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

| Resource | Description | Reference |
|----------|-------------|-----------|
| Worker | Serverless functions at the edge | [worker.md](references/worker.md) |
| Workflow | Long-running task orchestration | [workflow.md](references/workflow.md) |
| D1Database | Serverless SQL database | [d1-database.md](references/d1-database.md) |
| D1StateStore | State management with D1 | [d1-state-store.md](references/d1-state-store.md) |
| KVNamespace | Key-value storage | [kv-namespace.md](references/kv-namespace.md) |
| Queue | Reliable message delivery | [queue.md](references/queue.md) |
| Container | Docker containers on CF network | [container.md](references/container.md) |
| Route | URL pattern to Worker mapping | [route.md](references/route.md) |
| CustomDomain | Attach domains to Workers | [custom-domain.md](references/custom-domain.md) |
| Zone | DNS zone management | [zone.md](references/zone.md) |
| TanStackStart | Deploy TanStack Start apps to CF | [tanstack-start.md](references/tanstack-start.md) |
| Secret | Worker secrets management | [secret.md](references/secret.md) |
| SecretKey | Cryptographic key generation | [secret-key.md](references/secret-key.md) |
| SecretsStore | Centralized secrets storage | [secrets-store.md](references/secrets-store.md) |

## Common Patterns

### Bindings

```ts
const worker = await Worker("api", {
  entrypoint: "./src/worker.ts",
  bindings: {
    DB: db,                              // D1Database
    CACHE: cache,                        // KVNamespace
    QUEUE: queue,                        // Queue
    API_KEY: alchemy.secret("key"),      // Secret
  },
});
```

### Type-safe Environment

```ts
// src/worker.ts
import type { worker } from "../alchemy.run.ts";

export default {
  async fetch(request: Request, env: typeof worker.Env) {
    await env.DB.exec("SELECT 1");
    return new Response("OK");
  },
};
```

### Local Development

```bash
bun ./alchemy.run.ts --dev
```
