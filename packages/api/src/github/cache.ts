import { z } from "zod";

import { env } from "@bs-shame/env/server";

export type GithubCacheOptions = {
  ttlSeconds: number;
};

export async function getCachedJson<T>(
  key: string,
  schema: z.ZodType<T>,
  namespace: KVNamespace = env.GITHUB_CACHE,
): Promise<T | null> {
  const raw = await namespace.get(key, { type: "json" });
  if (!raw) {
    return null;
  }
  return schema.parse(raw);
}

export async function setCachedJson<T>(
  key: string,
  value: T,
  options: GithubCacheOptions,
  namespace: KVNamespace = env.GITHUB_CACHE,
) {
  await namespace.put(key, JSON.stringify(value), {
    expirationTtl: options.ttlSeconds,
  });
}
