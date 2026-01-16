import type { Context } from "hono";
import { db } from "@bs-shame/db";
import { githubInstallation, githubInstallationRepo } from "@bs-shame/db/schema/github";
import { env } from "@bs-shame/env/server";
import { and, eq } from "drizzle-orm";

type GitHubWebhookEvent =
  | {
      action: "created";
      installation: {
        id: number;
        account: {
          id: number;
          login: string;
          type: "User" | "Organization";
        };
      };
      repositories?: Array<{
        id: number;
        full_name: string;
      }>;
    }
  | {
      action: "deleted";
      installation: {
        id: number;
      };
    }
  | {
      action: "added" | "removed";
      installation: {
        id: number;
      };
      repositories_added?: Array<{
        id: number;
        full_name: string;
      }>;
      repositories_removed?: Array<{
        id: number;
        full_name: string;
      }>;
    }
  | {
      action: "opened" | "reopened" | "synchronize";
      pull_request: {
        id: number;
        number: number;
        user: {
          id: number;
          login: string;
        };
      };
      repository: {
        id: number;
        owner: {
          id: number;
        };
      };
      installation?: {
        id: number;
      };
    };

async function verifySignature(request: Request, body: string): Promise<boolean> {
  const signature = request.headers.get("x-hub-signature-256");
  if (!signature) {
    return false;
  }

  const webhookSecret = env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("GITHUB_WEBHOOK_SECRET not configured, skipping verification");
    return true;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = `sha256=${Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;

  return signature === expectedSignature;
}

async function handleInstallationCreated(
  event: Extract<GitHubWebhookEvent, { action: "created" }>,
) {
  const { installation, repositories } = event;

  await db
    .insert(githubInstallation)
    .values({
      installationId: installation.id,
      accountId: installation.account.id,
      accountLogin: installation.account.login,
      accountType: installation.account.type,
    })
    .onConflictDoUpdate({
      target: githubInstallation.installationId,
      set: {
        accountId: installation.account.id,
        accountLogin: installation.account.login,
        accountType: installation.account.type,
        suspendedAt: null,
      },
    });

  if (repositories && repositories.length > 0) {
    await db.insert(githubInstallationRepo).values(
      repositories.map((repo) => ({
        installationId: installation.id,
        githubRepoId: repo.id,
        fullName: repo.full_name,
      })),
    );
  }

  console.log(
    `Installation created: ${installation.id} for ${installation.account.login} with ${repositories?.length ?? 0} repos`,
  );
}

async function handleInstallationDeleted(
  event: Extract<GitHubWebhookEvent, { action: "deleted" }>,
) {
  const { installation } = event;

  await db
    .update(githubInstallation)
    .set({ suspendedAt: new Date() })
    .where(eq(githubInstallation.installationId, installation.id));

  console.log(`Installation deleted: ${installation.id}`);
}

async function handleRepositoriesChanged(
  event: Extract<GitHubWebhookEvent, { action: "added" | "removed" }>,
) {
  const { installation, repositories_added, repositories_removed } = event;

  if (repositories_added && repositories_added.length > 0) {
    await db.insert(githubInstallationRepo).values(
      repositories_added.map((repo) => ({
        installationId: installation.id,
        githubRepoId: repo.id,
        fullName: repo.full_name,
      })),
    );
    console.log(`Added ${repositories_added.length} repos to installation ${installation.id}`);
  }

  if (repositories_removed && repositories_removed.length > 0) {
    for (const repo of repositories_removed) {
      await db
        .delete(githubInstallationRepo)
        .where(
          and(
            eq(githubInstallationRepo.installationId, installation.id),
            eq(githubInstallationRepo.githubRepoId, repo.id),
          ),
        );
    }
    console.log(
      `Removed ${repositories_removed.length} repos from installation ${installation.id}`,
    );
  }
}

async function handlePullRequest(
  event: Extract<GitHubWebhookEvent, { action: "opened" | "reopened" | "synchronize" }>,
) {
  const { pull_request, repository } = event;

  // TODO: Check actor score and apply enforcement if needed
  // This will be implemented when we integrate the scoring system
  console.log(
    `PR #${pull_request.number} ${event.action} by ${pull_request.user.login} in repo ${repository.id}`,
  );
}

export async function githubWebhookHandler(c: Context) {
  const body = await c.req.text();

  const isValid = await verifySignature(c.req.raw, body);
  if (!isValid) {
    console.error("Invalid webhook signature");
    return c.json({ error: "Invalid signature" }, 401);
  }

  const eventType = c.req.header("x-github-event");
  if (!eventType) {
    return c.json({ error: "Missing x-github-event header" }, 400);
  }

  let event: GitHubWebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  try {
    switch (eventType) {
      case "installation":
        if (event.action === "created") {
          await handleInstallationCreated(event);
        } else if (event.action === "deleted") {
          await handleInstallationDeleted(event);
        }
        break;

      case "installation_repositories":
        if (event.action === "added" || event.action === "removed") {
          await handleRepositoriesChanged(event);
        }
        break;

      case "pull_request":
        if (
          event.action === "opened" ||
          event.action === "reopened" ||
          event.action === "synchronize"
        ) {
          await handlePullRequest(event);
        }
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return c.json({ ok: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}
