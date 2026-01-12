import { and, count, countDistinct, desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@bs-shame/db";
import {
  shameActor,
  shameActorLogin,
  shameEnforcement,
  shamePolicyOrg,
  shamePolicyRepo,
  shameReport,
} from "@bs-shame/db/schema/shame";

import { publicProcedure, router } from "../index";

const DEFAULT_POLICY = {
  mode: "manual" as const,
  flagAt: 2,
  banAt: 3,
};

type EffectivePolicy = {
  source: "org" | "repo";
  mode: "manual" | "auto";
  flagAt: number;
  banAt: number;
  orgPolicy: typeof shamePolicyOrg.$inferSelect | null;
  repoPolicy: typeof shamePolicyRepo.$inferSelect | null;
};

/**
 * Resolves effective policy for a scope (org or repo).
 * If repo policy is missing or mode='inherit', falls back to org policy.
 * If org policy is missing, uses system defaults.
 */
async function getEffectivePolicyInternal(
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
      orgPolicy: orgPolicy ?? null,
      repoPolicy,
    };
  }

  return {
    source: "org",
    mode: effectiveOrg.mode,
    flagAt: effectiveOrg.flagAt,
    banAt: effectiveOrg.banAt,
    orgPolicy: orgPolicy ?? null,
    repoPolicy: repoPolicy ?? null,
  };
}

/**
 * Computes occurrence counts for an actor across all scopes.
 */
async function getActorOccurrenceCounts(actorGithubUserId: number) {
  const [repoBans, orgBans, repoFlags, orgFlags] = await Promise.all([
    db
      .select({ count: countDistinct(shameReport.scopeGithubId) })
      .from(shameReport)
      .where(
        and(
          eq(shameReport.actorGithubUserId, actorGithubUserId),
          eq(shameReport.scope, "repo"),
          eq(shameReport.action, "ban"),
        ),
      ),
    db
      .select({ count: countDistinct(shameReport.scopeGithubId) })
      .from(shameReport)
      .where(
        and(
          eq(shameReport.actorGithubUserId, actorGithubUserId),
          eq(shameReport.scope, "org"),
          eq(shameReport.action, "ban"),
        ),
      ),
    db
      .select({ count: countDistinct(shameReport.scopeGithubId) })
      .from(shameReport)
      .where(
        and(
          eq(shameReport.actorGithubUserId, actorGithubUserId),
          eq(shameReport.scope, "repo"),
          eq(shameReport.action, "flag"),
        ),
      ),
    db
      .select({ count: countDistinct(shameReport.scopeGithubId) })
      .from(shameReport)
      .where(
        and(
          eq(shameReport.actorGithubUserId, actorGithubUserId),
          eq(shameReport.scope, "org"),
          eq(shameReport.action, "flag"),
        ),
      ),
  ]);

  return {
    repoBanOccurrences: repoBans[0]?.count ?? 0,
    orgBanOccurrences: orgBans[0]?.count ?? 0,
    repoFlagOccurrences: repoFlags[0]?.count ?? 0,
    orgFlagOccurrences: orgFlags[0]?.count ?? 0,
    totalBanOccurrences: (repoBans[0]?.count ?? 0) + (orgBans[0]?.count ?? 0),
    totalFlagOccurrences: (repoFlags[0]?.count ?? 0) + (orgFlags[0]?.count ?? 0),
  };
}

/**
 * Checks if an actor meets a given policy's thresholds.
 */
function meetsThresholds(
  counts: { totalBanOccurrences: number; totalFlagOccurrences: number },
  policy: { flagAt: number; banAt: number },
): { shouldFlag: boolean; shouldBan: boolean } {
  const totalOccurrences = counts.totalBanOccurrences + counts.totalFlagOccurrences;
  return {
    shouldFlag: totalOccurrences >= policy.flagAt,
    shouldBan: counts.totalBanOccurrences >= policy.banAt,
  };
}

const policyRouter = router({
  getEffective: publicProcedure
    .input(
      z.object({
        githubOwnerId: z.number(),
        githubRepoId: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      return getEffectivePolicyInternal(input.githubOwnerId, input.githubRepoId);
    }),
});

const actorRouter = router({
  get: publicProcedure
    .input(
      z.object({
        githubUserId: z.number().optional(),
        login: z.string().optional(),
        viewerContext: z
          .object({
            ownerId: z.number(),
            repoId: z.number().optional(),
          })
          .optional(),
        reportLimit: z.number().min(1).max(100).default(20),
        reportOffset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      if (!input.githubUserId && !input.login) {
        throw new Error("Either githubUserId or login must be provided");
      }

      // Find actor
      let actor: typeof shameActor.$inferSelect | undefined;
      if (input.githubUserId) {
        actor = await db.query.shameActor.findFirst({
          where: eq(shameActor.githubUserId, input.githubUserId),
        });
      } else if (input.login) {
        actor = await db.query.shameActor.findFirst({
          where: eq(shameActor.login, input.login),
        });
      }

      if (!actor) {
        return null;
      }

      // Load login history, reports with evidence, and counts in parallel
      const [logins, reportsWithEvidence, counts, totalReports, latestReport, reasonCodeCounts] =
        await Promise.all([
          db.query.shameActorLogin.findMany({
            where: eq(shameActorLogin.actorGithubUserId, actor.githubUserId),
            orderBy: desc(shameActorLogin.lastSeenAt),
          }),
          db.query.shameReport.findMany({
            where: eq(shameReport.actorGithubUserId, actor.githubUserId),
            with: { evidences: true },
            orderBy: desc(shameReport.createdAt),
            limit: input.reportLimit,
            offset: input.reportOffset,
          }),
          getActorOccurrenceCounts(actor.githubUserId),
          db
            .select({ count: count() })
            .from(shameReport)
            .where(eq(shameReport.actorGithubUserId, actor.githubUserId)),
          db.query.shameReport.findFirst({
            where: eq(shameReport.actorGithubUserId, actor.githubUserId),
            orderBy: desc(shameReport.createdAt),
          }),
          db
            .select({
              reasonCode: shameReport.reasonCode,
              count: count(),
            })
            .from(shameReport)
            .where(eq(shameReport.actorGithubUserId, actor.githubUserId))
            .groupBy(shameReport.reasonCode)
            .orderBy(desc(count())),
        ]);

      // Viewer context: check thresholds and existing enforcement
      let viewerResult:
        | {
            meetsThresholds: { shouldFlag: boolean; shouldBan: boolean };
            enforcement: typeof shameEnforcement.$inferSelect | null;
            policy: EffectivePolicy;
          }
        | undefined;

      if (input.viewerContext) {
        const policy = await getEffectivePolicyInternal(
          input.viewerContext.ownerId,
          input.viewerContext.repoId,
        );

        const scopeGithubId = input.viewerContext.repoId ?? input.viewerContext.ownerId;
        const scope = input.viewerContext.repoId ? "repo" : "org";

        const enforcement = await db.query.shameEnforcement.findFirst({
          where: and(
            eq(shameEnforcement.actorGithubUserId, actor.githubUserId),
            eq(shameEnforcement.scope, scope),
            eq(shameEnforcement.scopeGithubId, scopeGithubId),
            eq(shameEnforcement.active, true),
          ),
        });

        viewerResult = {
          meetsThresholds: meetsThresholds(counts, policy),
          enforcement: enforcement ?? null,
          policy,
        };
      }

      return {
        actor,
        logins,
        counts: {
          ...counts,
          latestReportAt: latestReport?.createdAt ?? null,
          topReasonCodes: reasonCodeCounts.slice(0, 5).map((r) => ({
            code: r.reasonCode,
            count: r.count,
          })),
        },
        reports: reportsWithEvidence,
        pagination: {
          total: totalReports[0]?.count ?? 0,
          limit: input.reportLimit,
          offset: input.reportOffset,
        },
        viewerContext: viewerResult,
      };
    }),
});

const orgRouter = router({
  dashboard: publicProcedure
    .input(
      z.object({
        githubOwnerId: z.number(),
        githubRepoId: z.number().optional(),
        filters: z
          .object({
            status: z.enum(["flag", "ban"]).optional(),
            active: z.boolean().optional(),
          })
          .optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const policy = await getEffectivePolicyInternal(input.githubOwnerId, input.githubRepoId);

      const scopeGithubId = input.githubRepoId ?? input.githubOwnerId;
      const scope = input.githubRepoId ? "repo" : "org";
      const offset = (input.page - 1) * input.pageSize;

      // Build enforcement filter conditions
      const enforcementConditions = [
        eq(shameEnforcement.scope, scope),
        eq(shameEnforcement.scopeGithubId, scopeGithubId),
      ];
      if (input.filters?.status) {
        enforcementConditions.push(eq(shameEnforcement.status, input.filters.status));
      }
      if (input.filters?.active !== undefined) {
        enforcementConditions.push(eq(shameEnforcement.active, input.filters.active));
      }

      // Load active enforcements and recent activity in parallel
      const [enforcements, enforcementTotal, recentReports, reportTotal] = await Promise.all([
        db.query.shameEnforcement.findMany({
          where: and(...enforcementConditions),
          with: { actor: true },
          orderBy: desc(shameEnforcement.createdAt),
          limit: input.pageSize,
          offset,
        }),
        db
          .select({ count: count() })
          .from(shameEnforcement)
          .where(and(...enforcementConditions)),
        db.query.shameReport.findMany({
          where: or(
            and(eq(shameReport.scope, "org"), eq(shameReport.scopeGithubId, input.githubOwnerId)),
            input.githubRepoId
              ? and(
                  eq(shameReport.scope, "repo"),
                  eq(shameReport.scopeGithubId, input.githubRepoId),
                )
              : undefined,
          ),
          with: { actor: true, evidences: true },
          orderBy: desc(shameReport.createdAt),
          limit: 10,
        }),
        db
          .select({ count: count() })
          .from(shameReport)
          .where(
            or(
              and(eq(shameReport.scope, "org"), eq(shameReport.scopeGithubId, input.githubOwnerId)),
              input.githubRepoId
                ? and(
                    eq(shameReport.scope, "repo"),
                    eq(shameReport.scopeGithubId, input.githubRepoId),
                  )
                : undefined,
            ),
          ),
      ]);

      // Find actors who meet thresholds but aren't yet enforced in this scope
      const enforcedActorIds = enforcements
        .filter((e) => e.active)
        .map((e) => e.actorGithubUserId);

      // Get actors with high occurrence counts who aren't enforced yet
      const recommendedActors = await db
        .select({
          actorGithubUserId: shameReport.actorGithubUserId,
          banCount: countDistinct(
            sql`CASE WHEN ${shameReport.action} = 'ban' THEN ${shameReport.scopeGithubId} END`,
          ),
          flagCount: countDistinct(
            sql`CASE WHEN ${shameReport.action} = 'flag' THEN ${shameReport.scopeGithubId} END`,
          ),
        })
        .from(shameReport)
        .groupBy(shameReport.actorGithubUserId)
        .having(
          or(
            sql`${countDistinct(sql`CASE WHEN ${shameReport.action} = 'ban' THEN ${shameReport.scopeGithubId} END`)} >= ${policy.banAt}`,
            sql`${countDistinct(shameReport.scopeGithubId)} >= ${policy.flagAt}`,
          ),
        );

      const recommendedActorIds = recommendedActors
        .filter((r) => !enforcedActorIds.includes(r.actorGithubUserId))
        .map((r) => r.actorGithubUserId);

      const recommendedActorDetails =
        recommendedActorIds.length > 0
          ? await db.query.shameActor.findMany({
              where: sql`${shameActor.githubUserId} IN (${sql.join(recommendedActorIds.map((id) => sql`${id}`), sql`, `)})`,
            })
          : [];

      return {
        policy,
        enforcements: {
          rows: enforcements,
          total: enforcementTotal[0]?.count ?? 0,
          page: input.page,
          pageSize: input.pageSize,
        },
        recentActivity: {
          reports: recentReports,
          totalReports: reportTotal[0]?.count ?? 0,
        },
        recommendations: recommendedActorDetails.map((actor) => {
          const counts = recommendedActors.find((r) => r.actorGithubUserId === actor.githubUserId);
          return {
            actor,
            banCount: counts?.banCount ?? 0,
            flagCount: counts?.flagCount ?? 0,
            shouldBan: (counts?.banCount ?? 0) >= policy.banAt,
            shouldFlag:
              ((counts?.banCount ?? 0) + (counts?.flagCount ?? 0)) >= policy.flagAt,
          };
        }),
        totals: {
          enforcements: enforcementTotal[0]?.count ?? 0,
          reports: reportTotal[0]?.count ?? 0,
          recommendedActions: recommendedActorDetails.length,
        },
      };
    }),
});

export const shameRouter = router({
  policy: policyRouter,
  actor: actorRouter,
  org: orgRouter,
});
