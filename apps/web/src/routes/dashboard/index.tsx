import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ScopePicker, useDashboardScope } from "@/components/scope-picker";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard/")(
{
  component: DashboardOverview,
});

function DashboardOverview() {
  const trpc = useTRPC();
  const privateData = useQuery(trpc.privateData.queryOptions());
  const { installation, installationId, repoId } = useDashboardScope();

  const dashboardData = useQuery({
    ...trpc.shame.org.dashboard.queryOptions({
      githubOwnerId: installation?.accountId ?? 0,
      githubRepoId: repoId ?? undefined,
    }),
    enabled: Boolean(installationId),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            {installation
              ? `Monitoring ${installation.accountLogin}${repoId ? " / repo" : ""}.`
              : "Select an installation to see policy status and activity."}
          </p>
        </div>
        <ScopePicker className="w-full sm:w-auto" />
      </div>

      {!installationId ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Select a GitHub installation to load your dashboard.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Protected Repos" value="12" />
            <StatCard label="Bad Actors Blocked" value="47" trend="+3 this week" />
            <StatCard label="Reports Filed" value="8" />
            <StatCard label="Network Size" value="1,284" sublabel="repos" />
          </div>

          <section>
            <h2 className="text-xl mb-4">Recommendations</h2>
            {dashboardData.isLoading ? (
              <div className="bg-card border border-border p-6 text-center text-muted-foreground">
                Loading recommendations...
              </div>
            ) : dashboardData.error ? (
              <div className="bg-card border border-border p-6 text-center text-red-600 dark:text-red-400">
                Error loading recommendations: {dashboardData.error.message}
              </div>
            ) : (
              <RecommendationsPanel
                recommendations={dashboardData.data?.recommendations ?? []}
                githubOwnerId={installation?.accountId ?? 0}
              />
            )}
          </section>

          <section>
            <h2 className="text-xl mb-4">Recent Activity</h2>
            <div className="space-y-2">
              <ActivityItem
                type="block"
                message="ai-slop-merchant was auto-blocked (3rd strike)"
                time="2 hours ago"
              />
              <ActivityItem
                type="report"
                message="You reported copilot-cowboy on vercel/next.js"
                time="1 day ago"
              />
              <ActivityItem
                type="install"
                message="bs-shame installed on your-org/new-repo"
                time="3 days ago"
              />
            </div>
          </section>

          <section className="bg-muted/30 border border-dashed border-border p-6">
            <h2 className="text-lg font-display mb-2">Policy Controls</h2>
            <p className="text-sm text-muted-foreground">
              Manage policy settings in the Settings tab for the selected scope.
            </p>
          </section>
        </>
      )}

      <div className="text-xs text-muted-foreground p-4 bg-muted/30 border border-border">
        <p>API: {privateData.data?.message ?? "loading..."}</p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  sublabel,
}: {
  label: string;
  value: string;
  trend?: string;
  sublabel?: string;
}) {
  return (
    <div className="bg-card border border-border p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-display text-foreground">{value}</p>
        {sublabel && <span className="text-sm text-muted-foreground">{sublabel}</span>}
      </div>
      {trend && <p className="text-xs text-shame-crimson mt-1">{trend}</p>}
    </div>
  );
}

function ActivityItem({
  type,
  message,
  time,
}: {
  type: "block" | "report" | "install";
  message: string;
  time: string;
}) {
  const icons = {
    block: (
      <svg
        className="size-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
        />
      </svg>
    ),
    report: (
      <svg
        className="size-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
        />
      </svg>
    ),
    install: (
      <svg
        className="size-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  const colors = {
    block: "text-shame-crimson bg-shame-crimson/10",
    report: "text-shame-gold bg-shame-gold/10",
    install: "text-green-600 bg-green-600/10 dark:text-green-400 dark:bg-green-400/10",
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border">
      <div className={`size-8 flex items-center justify-center ${colors[type]}`}>{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{message}</p>
      </div>
      <p className="text-xs text-muted-foreground whitespace-nowrap">{time}</p>
    </div>
  );
}



type Recommendation = {
  actor: {
    githubUserId: number;
    login: string;
    avatarUrl: string | null;
  };
  banCount: number;
  flagCount: number;
  shouldBan: boolean;
  shouldFlag: boolean;
};

function RecommendationsPanel({
  recommendations,
  githubOwnerId,
}: {
  recommendations: Recommendation[];
  githubOwnerId: number;
}) {
  const trpc = useTRPC();
  const [dismissedActors, setDismissedActors] = useState<Set<number>>(new Set());

  const setEnforcement = useMutation(
    trpc.shame.enforcement.set.mutationOptions({
      onSuccess: (_, variables) => {
        setDismissedActors((prev) => new Set(prev).add(variables.actorGithubUserId));
      },
    }),
  );

  const filteredRecommendations = recommendations.filter(
    (rec) => !dismissedActors.has(rec.actor.githubUserId),
  );

  if (filteredRecommendations.length === 0) {
    return (
      <div className="bg-card border border-border p-6 text-center text-muted-foreground">
        No recommendations at this time. All actors are below policy thresholds.
      </div>
    );
  }

  const handleAction = (rec: Recommendation, action: "flag" | "ban") => {
    setEnforcement.mutate({
      scope: "org",
      scopeGithubId: githubOwnerId,
      scopeLogin: "", // TODO: Get from context
      actorGithubUserId: rec.actor.githubUserId,
      actorLogin: rec.actor.login,
      status: action,
      source: "manual",
    });
  };

  const handleDismiss = (actorGithubUserId: number) => {
    setDismissedActors((prev) => new Set(prev).add(actorGithubUserId));
  };

  return (
    <div className="bg-card border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Actor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRecommendations.map((rec) => (
              <tr key={rec.actor.githubUserId} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {rec.actor.avatarUrl ? (
                      <img
                        src={rec.actor.avatarUrl}
                        alt={rec.actor.login}
                        className="size-8 rounded-full"
                      />
                    ) : (
                      <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          {rec.actor.login[0]?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{rec.actor.login}</p>
                      <p className="text-xs text-muted-foreground">ID: {rec.actor.githubUserId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Bans:</span>
                      <span className="text-sm font-medium text-shame-crimson">
                        {rec.banCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Flags:</span>
                      <span className="text-sm font-medium text-shame-gold">{rec.flagCount}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {rec.shouldBan && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-shame-crimson/10 text-shame-crimson border border-shame-crimson/30">
                        Should Ban
                      </span>
                    )}
                    {rec.shouldFlag && !rec.shouldBan && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-shame-gold/10 text-shame-gold border border-shame-gold/30">
                        Should Flag
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {rec.shouldFlag && (
                      <button
                        type="button"
                        onClick={() => handleAction(rec, "flag")}
                        disabled={setEnforcement.isPending}
                        className="px-3 py-1 text-xs font-medium bg-shame-gold hover:bg-shame-gold/90 text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="flag-actor"
                      >
                        Flag
                      </button>
                    )}
                    {rec.shouldBan && (
                      <button
                        type="button"
                        onClick={() => handleAction(rec, "ban")}
                        disabled={setEnforcement.isPending}
                        className="px-3 py-1 text-xs font-medium bg-shame-crimson hover:bg-shame-crimson/90 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="ban-actor"
                      >
                        Ban
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDismiss(rec.actor.githubUserId)}
                      className="px-3 py-1 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
                      data-testid="dismiss-actor"
                    >
                      Dismiss
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {setEnforcement.isError && (
        <div className="p-3 bg-red-500/10 border-t border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          Error: {setEnforcement.error.message}
        </div>
      )}

      {setEnforcement.isSuccess && (
        <div className="p-3 bg-green-500/10 border-t border-green-500/30 text-green-600 dark:text-green-400 text-sm">
          Enforcement action applied successfully!
        </div>
      )}
    </div>
  );
}
