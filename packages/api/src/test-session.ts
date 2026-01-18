import { and, eq } from "drizzle-orm";

import { db } from "@bs-shame/db";
import { account, user } from "@bs-shame/db/schema/auth";
import { githubInstallation, githubInstallationRepo } from "@bs-shame/db/schema/github";

const TEST_INSTALLATION_ID = 4200;
const TEST_REPO_ID = 9001;
const TEST_ACCOUNT_ID = 77777;
const TEST_REPO_SUFFIX = "test-repo";
const TEST_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type TestSession = {
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

function sanitizeTestHandle(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "tester";
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9-_]/g, "");
  return normalized || "tester";
}

export function isTestStage(stage?: string | null) {
  return Boolean(stage && stage.startsWith("test"));
}

export async function getTestSessionFromHeaders(headers: Headers, stage?: string | null) {
  if (!isTestStage(stage)) {
    return null;
  }
  const raw = headers.get("x-test-user");
  if (!raw) {
    return null;
  }
  return createTestSession(raw);
}

async function createTestSession(raw: string): Promise<TestSession> {
  const handle = sanitizeTestHandle(raw);
  const userId = `test-${handle}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TEST_SESSION_TTL_MS);

  const userRecord = {
    id: userId,
    name: `Test ${handle}`,
    email: `${handle}@example.com`,
    emailVerified: true,
    image: null,
    createdAt: now,
    updatedAt: now,
  };

  await db
    .insert(user)
    .values(userRecord)
    .onConflictDoUpdate({
      target: user.id,
      set: {
        name: userRecord.name,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        updatedAt: now,
      },
    });

  await db
    .insert(account)
    .values({
      id: `test-account-${handle}`,
      accountId: String(TEST_ACCOUNT_ID),
      providerId: "github",
      userId,
      accessToken: "test-token",
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scope: "repo",
      password: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: account.id,
      set: {
        userId,
        accessToken: "test-token",
        updatedAt: now,
      },
    });

  await db
    .insert(githubInstallation)
    .values({
      installationId: TEST_INSTALLATION_ID,
      accountId: TEST_ACCOUNT_ID,
      accountLogin: handle,
      accountType: "User",
      installedByUserId: userId,
      installedByAccountId: TEST_ACCOUNT_ID,
      installedByLogin: handle,
      createdAt: now,
      suspendedAt: null,
    })
    .onConflictDoUpdate({
      target: githubInstallation.installationId,
      set: {
        accountLogin: handle,
        installedByUserId: userId,
        installedByAccountId: TEST_ACCOUNT_ID,
        installedByLogin: handle,
        suspendedAt: null,
      },
    });

  const repoName = `${handle}/${TEST_REPO_SUFFIX}`;

  await db
    .insert(githubInstallationRepo)
    .values({
      installationId: TEST_INSTALLATION_ID,
      githubRepoId: TEST_REPO_ID,
      fullName: repoName,
      addedAt: now,
    })
    .onConflictDoUpdate({
      target: [githubInstallationRepo.installationId, githubInstallationRepo.githubRepoId],
      set: {
        fullName: repoName,
      },
    });

  return {
    session: {
      id: `session-${userId}`,
      token: `token-${userId}`,
      userId,
      expiresAt,
      createdAt: now,
      updatedAt: now,
      ipAddress: null,
      userAgent: null,
    },
    user: userRecord,
  };
}

export async function ensureTestInstallationRepo(
  handle: string,
  repoFullName: string,
  repoId: number,
) {
  const normalized = sanitizeTestHandle(handle);
  const userId = `test-${normalized}`;
  const now = new Date();

  const existingAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "github")),
  });

  if (!existingAccount) {
    await createTestSession(normalized);
  }

  await db
    .insert(githubInstallationRepo)
    .values({
      installationId: TEST_INSTALLATION_ID,
      githubRepoId: repoId,
      fullName: repoFullName,
      addedAt: now,
    })
    .onConflictDoUpdate({
      target: [githubInstallationRepo.installationId, githubInstallationRepo.githubRepoId],
      set: {
        fullName: repoFullName,
      },
    });
}

export function getDefaultTestInstallation() {
  return {
    installationId: TEST_INSTALLATION_ID,
    repoId: TEST_REPO_ID,
    accountId: TEST_ACCOUNT_ID,
    repoSuffix: TEST_REPO_SUFFIX,
  };
}
