import { and, eq, sql } from "drizzle-orm";

import { db } from "@bs-shame/db";
import type { ShameOrgPolicyMode, ShameRepoPolicyMode, ShameScope } from "@bs-shame/db/schema/shame";
import { shamePolicyOrg, shamePolicyRepo, shameReport } from "@bs-shame/db/schema/shame";

export type PolicyConfig = {
  mode: ShameOrgPolicyMode;
  flagAt: number;
  banAt: number;
};

export type RepoPolicyConfig = {
  mode: ShameRepoPolicyMode;
  flagAt: number;
  banAt: number;
};

export type EffectivePolicy = {
  source: ShameScope;
  orgPolicy: PolicyConfig | null;
  repoPolicy: RepoPolicyConfig | null;
} & PolicyConfig;

export const DEFAULT_POLICY: PolicyConfig = {
  mode: "manual",
  flagAt: 2,
  banAt: 3,
};

function projectPolicySafe(policy: typeof shamePolicyOrg.$inferSelect | null): PolicyConfig | null {
  if (!policy) return null;
  return {
    mode: policy.mode,
    flagAt: policy.flagAt,
    banAt: policy.banAt,
  };
}

export async function getEffectivePolicy(
  githubOwnerId: number,
  githubRepoId?: number,
): Promise<EffectivePolicy> {
  const [orgPolicy, repoPolicy] = await Promise.all([
    db.query.shamePolicyOrg.findFirst({
      where: eq(shamePolicyOrg.githubOwnerId, githubOwnerId),
    }),
    githubRepoId
      ? db.query.shamePolicyRepo.findFirst({
          where: eq(shamePolicyRepo.githubRepoId, githubRepoId),
        })
      : Promise.resolve(null),
  ]);

  const effectiveOrg = orgPolicy ?? { ...DEFAULT_POLICY, githubOwnerId };

  if (repoPolicy && repoPolicy.mode !== "inherit") {
    return {
      source: "repo",
      mode: repoPolicy.mode,
      flagAt: repoPolicy.flagAt,
      banAt: repoPolicy.banAt,
      orgPolicy: projectPolicySafe(orgPolicy ?? null),
      repoPolicy: {
        mode: repoPolicy.mode,
        flagAt: repoPolicy.flagAt,
        banAt: repoPolicy.banAt,
      },
    };
  }

  return {
    source: "org",
    mode: effectiveOrg.mode,
    flagAt: effectiveOrg.flagAt,
    banAt: effectiveOrg.banAt,
    orgPolicy: projectPolicySafe(orgPolicy ?? null),
    repoPolicy: repoPolicy
      ? {
          mode: repoPolicy.mode,
          flagAt: repoPolicy.flagAt,
          banAt: repoPolicy.banAt,
        }
      : null,
  };
}

export async function getActorOccurrenceCounts(actorGithubUserId: number) {
  const result = await db
    .select({
      repoBanOccurrences: sql<number>`COUNT(DISTINCT CASE WHEN ${shameReport.scope} = 'repo' AND ${shameReport.action} = 'ban' THEN ${shameReport.scope} || ':' || ${shameReport.scopeGithubId} END)`,
      orgBanOccurrences: sql<number>`COUNT(DISTINCT CASE WHEN ${shameReport.scope} = 'org' AND ${shameReport.action} = 'ban' THEN ${shameReport.scope} || ':' || ${shameReport.scopeGithubId} END)`,
      repoFlagOccurrences: sql<number>`COUNT(DISTINCT CASE WHEN ${shameReport.scope} = 'repo' AND ${shameReport.action} = 'flag' THEN ${shameReport.scope} || ':' || ${shameReport.scopeGithubId} END)`,
      orgFlagOccurrences: sql<number>`COUNT(DISTINCT CASE WHEN ${shameReport.scope} = 'org' AND ${shameReport.action} = 'flag' THEN ${shameReport.scope} || ':' || ${shameReport.scopeGithubId} END)`,
    })
    .from(shameReport)
    .where(
      and(
        eq(shameReport.actorGithubUserId, actorGithubUserId),
        eq(shameReport.visibility, "public"),
      ),
    );

  const r = result[0] ?? {
    repoBanOccurrences: 0,
    orgBanOccurrences: 0,
    repoFlagOccurrences: 0,
    orgFlagOccurrences: 0,
  };

  return {
    repoBanOccurrences: Number(r.repoBanOccurrences),
    orgBanOccurrences: Number(r.orgBanOccurrences),
    repoFlagOccurrences: Number(r.repoFlagOccurrences),
    orgFlagOccurrences: Number(r.orgFlagOccurrences),
    totalBanOccurrences: Number(r.repoBanOccurrences) + Number(r.orgBanOccurrences),
    totalFlagOccurrences: Number(r.repoFlagOccurrences) + Number(r.orgFlagOccurrences),
  };
}

export function meetsThresholds(
  counts: { totalBanOccurrences: number; totalFlagOccurrences: number },
  policy: { flagAt: number; banAt: number },
): { shouldFlag: boolean; shouldBan: boolean } {
  const totalOccurrences = counts.totalBanOccurrences + counts.totalFlagOccurrences;
  return {
    shouldFlag: totalOccurrences >= policy.flagAt,
    shouldBan: counts.totalBanOccurrences >= policy.banAt,
  };
}
