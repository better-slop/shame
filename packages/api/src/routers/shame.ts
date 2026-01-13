import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@bs-shame/db";
import type {
  ShameEvidenceKind,
  ShameOrgPolicyMode,
  ShameRepoPolicyMode,
  ShameReasonCode,
  ShameScope,
} from "@bs-shame/db/schema/shame";
import {
  shameActor,
  shameActorLogin,
  shameEnforcement,
  shameEvidence,
  shamePolicyOrg,
  shamePolicyRepo,
  shameReport,
} from "@bs-shame/db/schema/shame";

import { publicProcedure, router } from "../index";

type PolicyConfig = {
  mode: ShameOrgPolicyMode;
  flagAt: number;
  banAt: number;
};

type RepoPolicyConfig = {
  mode: ShameRepoPolicyMode;
  flagAt: number;
  banAt: number;
};

type EffectivePolicy = {
  source: ShameScope;
  orgPolicy: PolicyConfig | null;
  repoPolicy: RepoPolicyConfig | null;
} & PolicyConfig;

const DEFAULT_POLICY: PolicyConfig = {
  mode: "manual",
  flagAt: 2,
  banAt: 3,
};

/**
 * Projects only safe (non-audit) fields from a report row.
 */
function projectReportSafe(report: typeof shameReport.$inferSelect) {
  return {
    id: report.id,
    scope: report.scope,
    scopeGithubId: report.scopeGithubId,
    scopeLogin: report.scopeLogin,
    actorGithubUserId: report.actorGithubUserId,
    actorLogin: report.actorLogin,
    action: report.action,
    reasonCode: report.reasonCode,
    reasonText: report.reasonText,
    createdAt: report.createdAt,
  };
}

/**
 * Projects only safe fields from an enforcement row.
 */
function projectEnforcementSafe(enforcement: typeof shameEnforcement.$inferSelect) {
  return {
    id: enforcement.id,
    scope: enforcement.scope,
    scopeGithubId: enforcement.scopeGithubId,
    scopeLogin: enforcement.scopeLogin,
    actorGithubUserId: enforcement.actorGithubUserId,
    actorLogin: enforcement.actorLogin,
    status: enforcement.status,
    source: enforcement.source,
    active: enforcement.active,
    createdAt: enforcement.createdAt,
    revokedAt: enforcement.revokedAt,
  };
}

/**
 * Projects only safe fields from a policy row.
 */
function projectPolicySafe(policy: typeof shamePolicyOrg.$inferSelect | null): PolicyConfig | null {
  if (!policy) return null;
  return {
    mode: policy.mode,
    flagAt: policy.flagAt,
    banAt: policy.banAt,
  };
}

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

/**
 * Computes occurrence counts for an actor across all scopes.
 * Uses COUNT(DISTINCT (scope, scope_github_id)) to avoid collision between org/repo IDs.
 */
async function getActorOccurrenceCounts(actorGithubUserId: number) {
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

/**
 * Finds an actor by githubUserId or login (including historical logins).
 */
async function findActorByIdOrLogin(
  githubUserId?: number,
  login?: string,
): Promise<typeof shameActor.$inferSelect | null> {
  if (githubUserId) {
    const actor = await db.query.shameActor.findFirst({
      where: eq(shameActor.githubUserId, githubUserId),
    });
    return actor ?? null;
  }

  if (login) {
    const normalizedLogin = login.trim().toLowerCase();
    if (!normalizedLogin) return null;

    // First try current login (case-insensitive)
    let actor = await db.query.shameActor.findFirst({
      where: sql`lower(${shameActor.login}) = ${normalizedLogin}`,
    });
    if (actor) return actor;

    // Check historical logins (case-insensitive, most recent)
    const historicalLogin = await db.query.shameActorLogin.findFirst({
      where: sql`lower(${shameActorLogin.login}) = ${normalizedLogin}`,
      orderBy: desc(shameActorLogin.lastSeenAt),
    });
    if (historicalLogin) {
      actor = await db.query.shameActor.findFirst({
        where: eq(shameActor.githubUserId, historicalLogin.actorGithubUserId),
      });
      return actor ?? null;
    }
  }

  return null;
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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either githubUserId or login must be provided",
        });
      }

      const actor = await findActorByIdOrLogin(input.githubUserId, input.login);
      if (!actor) {
        return null;
      }

      // Only fetch public reports
      const publicReportCondition = and(
        eq(shameReport.actorGithubUserId, actor.githubUserId),
        eq(shameReport.visibility, "public"),
      );

      const [logins, reports, counts, totalReports, latestReport, reasonCodeCounts] =
        await Promise.all([
          db.query.shameActorLogin.findMany({
            where: eq(shameActorLogin.actorGithubUserId, actor.githubUserId),
            orderBy: desc(shameActorLogin.lastSeenAt),
          }),
          db
            .select({
              report: shameReport,
            })
            .from(shameReport)
            .where(publicReportCondition)
            .orderBy(desc(shameReport.createdAt))
            .limit(input.reportLimit)
            .offset(input.reportOffset),
          getActorOccurrenceCounts(actor.githubUserId),
          db.select({ count: count() }).from(shameReport).where(publicReportCondition),
          db.query.shameReport.findFirst({
            where: publicReportCondition,
            orderBy: desc(shameReport.createdAt),
          }),
          db
            .select({
              reasonCode: shameReport.reasonCode,
              count: count(),
            })
            .from(shameReport)
            .where(publicReportCondition)
            .groupBy(shameReport.reasonCode)
            .orderBy(desc(count())),
        ]);

      // Fetch evidence for reports
      const reportIds = reports.map((r) => r.report.id);
      const evidences =
        reportIds.length > 0
          ? await db.query.shameEvidence.findMany({
              where: inArray(shameEvidence.reportId, reportIds),
            })
          : [];

      const evidenceByReport = new Map<string, (typeof evidences)[number][]>();
      for (const e of evidences) {
        const list = evidenceByReport.get(e.reportId) ?? [];
        list.push(e);
        evidenceByReport.set(e.reportId, list);
      }

      // Viewer context: check thresholds and existing enforcement
      let viewerResult:
        | {
            meetsThresholds: { shouldFlag: boolean; shouldBan: boolean };
            enforcement: ReturnType<typeof projectEnforcementSafe> | null;
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
          enforcement: enforcement ? projectEnforcementSafe(enforcement) : null,
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
            count: Number(r.count),
          })),
        },
        reports: reports.map((r) => ({
          ...projectReportSafe(r.report),
          evidences: evidenceByReport.get(r.report.id) ?? [],
        })),
        pagination: {
          total: Number(totalReports[0]?.count ?? 0),
          limit: input.reportLimit,
          offset: input.reportOffset,
        },
        viewerContext: viewerResult,
      };
    }),
});

const wallRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        sort: z.enum(["recent", "reports", "oldest"]).default("recent"),
      }),
    )
    .query(async ({ input }) => {
      // Group reports by actor, get counts and date ranges
      const actorStats = await db
        .select({
          actorGithubUserId: shameReport.actorGithubUserId,
          reportCount: sql<number>`COUNT(DISTINCT ${shameReport.scope} || ':' || ${shameReport.scopeGithubId})`,
          firstReported: sql<number>`MIN(${shameReport.createdAt})`,
          lastReported: sql<number>`MAX(${shameReport.createdAt})`,
        })
        .from(shameReport)
        .where(eq(shameReport.visibility, "public"))
        .groupBy(shameReport.actorGithubUserId)
        .orderBy(
          input.sort === "reports"
            ? desc(sql`COUNT(DISTINCT ${shameReport.scope} || ':' || ${shameReport.scopeGithubId})`)
            : input.sort === "oldest"
              ? sql`MIN(${shameReport.createdAt})`
              : desc(sql`MAX(${shameReport.createdAt})`),
        )
        .limit(input.limit)
        .offset(input.offset);

      if (actorStats.length === 0) {
        return { entries: [], total: 0 };
      }

      const actorIds = actorStats.map((s) => s.actorGithubUserId);

      // Fetch actor details
      const actors = await db.query.shameActor.findMany({
        where: inArray(shameActor.githubUserId, actorIds),
      });

      // Fetch latest report per actor for reason text
      const latestReports = await db
        .select({
          actorGithubUserId: shameReport.actorGithubUserId,
          reasonCode: shameReport.reasonCode,
          reasonText: shameReport.reasonText,
        })
        .from(shameReport)
        .where(
          and(
            inArray(shameReport.actorGithubUserId, actorIds),
            eq(shameReport.visibility, "public"),
          ),
        )
        .orderBy(desc(shameReport.createdAt));

      const latestReportByActor = new Map<
        number,
        { reasonCode: ShameReasonCode; reasonText: string | null }
      >();
      for (const r of latestReports) {
        if (!latestReportByActor.has(r.actorGithubUserId)) {
          latestReportByActor.set(r.actorGithubUserId, {
            reasonCode: r.reasonCode,
            reasonText: r.reasonText,
          });
        }
      }

      // Fetch evidence sources (up to 3 per actor)
      const evidences = await db
        .select({
          reportId: shameEvidence.reportId,
          kind: shameEvidence.kind,
          url: shameEvidence.url,
          actorGithubUserId: shameReport.actorGithubUserId,
          scopeLogin: shameReport.scopeLogin,
        })
        .from(shameEvidence)
        .innerJoin(shameReport, eq(shameEvidence.reportId, shameReport.id))
        .where(
          and(
            inArray(shameReport.actorGithubUserId, actorIds),
            eq(shameReport.visibility, "public"),
          ),
        )
        .orderBy(desc(shameEvidence.createdAt))
        .limit(actorIds.length * 3);

      const sourcesByActor = new Map<
        number,
        Array<{ repo: string; type: ShameEvidenceKind; url: string }>
      >();
      for (const e of evidences) {
        const list = sourcesByActor.get(e.actorGithubUserId) ?? [];
        if (list.length < 3) {
          list.push({
            repo: e.scopeLogin,
            type: e.kind,
            url: e.url,
          });
          sourcesByActor.set(e.actorGithubUserId, list);
        }
      }

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${shameReport.actorGithubUserId})` })
        .from(shameReport)
        .where(eq(shameReport.visibility, "public"));

      const actorMap = new Map(actors.map((a) => [a.githubUserId, a]));

      const entries = actorStats.map((stat) => {
        const actor = actorMap.get(stat.actorGithubUserId);
        const latestReport = latestReportByActor.get(stat.actorGithubUserId);
        const sources = sourcesByActor.get(stat.actorGithubUserId) ?? [];

        return {
          id: String(stat.actorGithubUserId),
          username: actor?.login ?? "unknown",
          avatarUrl: actor?.avatarUrl ?? undefined,
          reason: latestReport?.reasonText ?? latestReport?.reasonCode ?? "No reason provided",
          reportCount: Number(stat.reportCount),
          firstReported: new Date(stat.firstReported).toISOString().split("T")[0],
          lastReported: new Date(stat.lastReported).toISOString().split("T")[0],
          sources,
        };
      });

      return {
        entries,
        total: Number(totalResult[0]?.count ?? 0),
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

      // Load enforcements for this scope (filters apply) + total count.
      // Also fetch all actively-enforced actor ids (ignores filters) so we never
      // recommend an actor already enforced on another page.
      const [enforcements, enforcementTotal, activeEnforcedRows] = await Promise.all([
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
        db
          .select({ actorGithubUserId: shameEnforcement.actorGithubUserId })
          .from(shameEnforcement)
          .where(
            and(
              eq(shameEnforcement.scope, scope),
              eq(shameEnforcement.scopeGithubId, scopeGithubId),
              eq(shameEnforcement.active, true),
            ),
          ),
      ]);

      const activeEnforcedActorIds = [
        ...new Set(activeEnforcedRows.map((r) => r.actorGithubUserId)),
      ];

      // Get actors with high occurrence counts (globally) who aren't enforced yet
      // Uses composite distinct to avoid org/repo ID collision
      const banCountExpr = sql<number>`COUNT(DISTINCT CASE WHEN ${shameReport.action} = 'ban' THEN ${shameReport.scope} || ':' || ${shameReport.scopeGithubId} END)`;
      const flagCountExpr = sql<number>`COUNT(DISTINCT CASE WHEN ${shameReport.action} = 'flag' THEN ${shameReport.scope} || ':' || ${shameReport.scopeGithubId} END)`;
      const totalOccurrenceExpr = sql<number>`COUNT(DISTINCT ${shameReport.scope} || ':' || ${shameReport.scopeGithubId})`;

      const recommendedActors = await db
        .select({
          actorGithubUserId: shameReport.actorGithubUserId,
          banCount: banCountExpr,
          flagCount: flagCountExpr,
        })
        .from(shameReport)
        .where(eq(shameReport.visibility, "public"))
        .groupBy(shameReport.actorGithubUserId)
        .having(
          or(
            sql`${banCountExpr} >= ${policy.banAt}`,
            sql`${totalOccurrenceExpr} >= ${policy.flagAt}`,
          ),
        )
        .orderBy(desc(banCountExpr), desc(totalOccurrenceExpr))
        .limit(200);

      const recommendedActorIds = recommendedActors
        .filter((r) => !activeEnforcedActorIds.includes(r.actorGithubUserId))
        .map((r) => r.actorGithubUserId);

      const recommendedActorDetails =
        recommendedActorIds.length > 0
          ? await db.query.shameActor.findMany({
              where: inArray(shameActor.githubUserId, recommendedActorIds),
            })
          : [];

      // Global recent activity: reports for actors that affect this org's thresholds
      // (actors who are recommended or already enforced)
      const relevantActorIds = [...new Set([...activeEnforcedActorIds, ...recommendedActorIds])];

      const [globalRecentReports, globalReportTotal] =
        relevantActorIds.length > 0
          ? await Promise.all([
              db
                .select({ report: shameReport, actor: shameActor })
                .from(shameReport)
                .innerJoin(shameActor, eq(shameReport.actorGithubUserId, shameActor.githubUserId))
                .where(
                  and(
                    inArray(shameReport.actorGithubUserId, relevantActorIds),
                    eq(shameReport.visibility, "public"),
                  ),
                )
                .orderBy(desc(shameReport.createdAt))
                .limit(10),
              db
                .select({ count: count() })
                .from(shameReport)
                .where(
                  and(
                    inArray(shameReport.actorGithubUserId, relevantActorIds),
                    eq(shameReport.visibility, "public"),
                  ),
                ),
            ])
          : [[], [{ count: 0 }]];

      // Fetch evidence for recent reports
      const recentReportIds = globalRecentReports.map((r) => r.report.id);
      const recentEvidences =
        recentReportIds.length > 0
          ? await db.query.shameEvidence.findMany({
              where: inArray(shameEvidence.reportId, recentReportIds),
            })
          : [];

      const evidenceByReport = new Map<string, (typeof recentEvidences)[number][]>();
      for (const e of recentEvidences) {
        const list = evidenceByReport.get(e.reportId) ?? [];
        list.push(e);
        evidenceByReport.set(e.reportId, list);
      }

      return {
        policy,
        enforcements: {
          rows: enforcements.map((e) => ({
            ...projectEnforcementSafe(e),
            actor: e.actor,
          })),
          total: Number(enforcementTotal[0]?.count ?? 0),
          page: input.page,
          pageSize: input.pageSize,
        },
        recentActivity: {
          reports: globalRecentReports.map((r) => ({
            ...projectReportSafe(r.report),
            actor: r.actor,
            evidences: evidenceByReport.get(r.report.id) ?? [],
          })),
          totalReports: Number(globalReportTotal[0]?.count ?? 0),
        },
        recommendations: recommendedActorDetails.map((actor) => {
          const counts = recommendedActors.find((r) => r.actorGithubUserId === actor.githubUserId);
          const banCount = Number(counts?.banCount ?? 0);
          const flagCount = Number(counts?.flagCount ?? 0);
          return {
            actor,
            banCount,
            flagCount,
            shouldBan: banCount >= policy.banAt,
            shouldFlag: banCount + flagCount >= policy.flagAt,
          };
        }),
        totals: {
          enforcements: Number(enforcementTotal[0]?.count ?? 0),
          reports: Number(globalReportTotal[0]?.count ?? 0),
          recommendedActions: recommendedActorDetails.length,
        },
      };
    }),
});

export const shameRouter = router({
  policy: policyRouter,
  actor: actorRouter,
  org: orgRouter,
  wall: wallRouter,
});
