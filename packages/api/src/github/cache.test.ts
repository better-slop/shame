import { describe, expect, test } from "bun:test";
import { z } from "zod";

import { getCachedJson, setCachedJson } from "./cache";

const store = new Map<string, string>();

const kv = {
  get: async (key: string) => {
    const value = store.get(key);
    if (!value) return null;
    return value;
  },
  put: async (key: string, value: string) => {
    store.set(key, value);
  },
  delete: async (key: string) => {
    store.delete(key);
  },
} as unknown as KVNamespace;

describe("getCachedJson/setCachedJson", () => {
  test("round trips JSON with schema", async () => {
    const schema = z.object({ ok: z.boolean(), count: z.number() });

    await setCachedJson("cache:test", { ok: true, count: 2 }, { ttlSeconds: 60 }, kv);

    const result = await getCachedJson("cache:test", schema, kv);

    expect(result).toEqual({ ok: true, count: 2 });
  });
});
