import { beforeAll, beforeEach, describe, expect, test, mock } from "bun:test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as schema from "@bs-shame/db/schema";
import { account, session, user, verification } from "@bs-shame/db/schema/auth";
import {
  shameActor,
  shameActorLogin,
  shameEvidence,
  shameEnforcement,
  shamePolicyOrg,
  shamePolicyRepo,
  shameReport,
} from "@bs-shame/db/schema/shame";

const client = createClient({ url: "file::memory:" });
const db = drizzle(client, { schema });

mock.module("@bs-shame/db", () => ({ db }));

const { shameRouter } = await import("./shame");

const caller = shameRouter.createCaller({ session: null });
const migrationsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../db/src/migrations",
);

async function resetDb() {
  await db.delete(shameEvidence);
  await db.delete(shameEnforcement);
  await db.delete(shameReport);
  await db.delete(shameActorLogin);
  await db.delete(shameActor);
  await db.delete(shamePolicyRepo);
  await db.delete(shamePolicyOrg);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder });
});

beforeEach(async () => {
  await resetDb();
});

describe("shame router integration", () => {
  test("creates reports and exposes evidence in actor view", async () => {
    const report = await caller.report.create({
      scope: "repo",
      scopeGithubId: 1001,
      scopeLogin: "acme/road-runner",
      actorGithubUserId: 4242,
      actorLogin: "spam-bot",
      action: "ban",
      reasonCode: "spam",
      reasonText: "copy-paste spam",
      evidence: [
        {
          kind: "issue",
          url: "https://example.com/issues/1",
          githubRepoId: 1001,
          githubNumber: 1,
        },
      ],
    });

    if (!report) {
      throw new Error("Expected report to be created");
    }

    expect(report.id).toBe("repo:1001:4242");

    const actorDetail = await caller.actor.get({ githubUserId: 4242 });
    expect(actorDetail).not.toBeNull();
    if (!actorDetail) {
      throw new Error("Expected actor detail to be present");
    }

    expect(actorDetail.actor.login).toBe("spam-bot");
    expect(actorDetail.reports).toHaveLength(1);
    expect(actorDetail.reports[0]?.evidences).toHaveLength(1);
  });

  test("sets and revokes enforcement entries", async () => {
    const enforcement = await caller.enforcement.set({
      scope: "org",
      scopeGithubId: 88,
      scopeLogin: "acme",
      actorGithubUserId: 4242,
      actorLogin: "spam-bot",
      status: "flag",
      source: "manual",
    });

    if (!enforcement) {
      throw new Error("Expected enforcement to be created");
    }

    expect(enforcement.active).toBe(true);

    const revoked = await caller.enforcement.revoke({
      enforcementId: enforcement.id,
    });

    expect(revoked.active).toBe(false);
    expect(revoked.revokedAt).not.toBeNull();
  });

  test("resolves repo policy overrides", async () => {
    await caller.policy.setOrg({
      githubOwnerId: 77,
      mode: "auto",
      flagAt: 3,
      banAt: 2,
    });

    await caller.policy.setRepo({
      githubRepoId: 7701,
      githubOwnerId: 77,
      mode: "manual",
      flagAt: 5,
      banAt: 4,
    });

    const effective = await caller.policy.getEffective({
      githubOwnerId: 77,
      githubRepoId: 7701,
    });

    expect(effective.source).toBe("repo");
    expect(effective.flagAt).toBe(5);
    expect(effective.banAt).toBe(4);
    expect(effective.orgPolicy?.mode).toBe("auto");
    expect(effective.repoPolicy?.mode).toBe("manual");
  });
});
