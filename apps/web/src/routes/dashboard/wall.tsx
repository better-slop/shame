import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";

import { useTRPC } from "@/utils/trpc";
import { ScopePicker, dashboardSearchSchema } from "@/components/scope-picker";
import {
  StoneCard,
  StoneCardContent,
  StoneCardHeader,
  ShameBadge,
} from "@/components/ui/stone-card";

export const Route = createFileRoute("/dashboard/wall")({
  validateSearch: dashboardSearchSchema,
  component: DashboardWallPage,
});

function DashboardWallPage() {
  const search = useSearch({ from: "/dashboard/wall" });
  const navigate = useNavigate({ from: "/dashboard/wall" });
  const trpc = useTRPC();

  const ownerId = search.ownerId ?? null;
  const repoId = search.repoId ?? null;

  const setOwnerId = (id: number | null) => {
    navigate({ search: { ...search, ownerId: id ?? undefined } });
  };
  const setRepoId = (id: number | null) => {
    navigate({ search: { ...search, repoId: id ?? undefined } });
  };

  const dashboardQuery = useQuery({
    ...trpc.shame.org.dashboard.queryOptions({
      githubOwnerId: ownerId ?? 0,
      githubRepoId: repoId ?? undefined,
      page: 1,
      pageSize: 20,
    }),
    enabled: ownerId !== null,
  });

  const { data, isLoading, error } = dashboardQuery;

  if (!ownerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display">Organization Wall</h1>
        <ScopePicker
          ownerId={ownerId}
          repoId={repoId}
          onOwnerChange={setOwnerId}
          onRepoChange={setRepoId}
        />
        <div className="text-center py-12 text-muted-foreground">
          <p>Select an organization to view their wall.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">Organization Wall</h1>

      <ScopePicker
        ownerId={ownerId}
        repoId={repoId}
        onOwnerChange={setOwnerId}
        onRepoChange={setRepoId}
      />

      {isLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 border border-shame-crimson/50 bg-shame-crimson/10 text-shame-crimson">
          Failed to load dashboard: {error.message}
        </div>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recommendations */}
          <section className="lg:col-span-2">
            <h2 className="text-lg font-display mb-3">Recommendations</h2>
            {data.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recommendations at this time.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.recommendations.map((rec) => (
                  <StoneCard key={rec.actor.githubUserId}>
                    <StoneCardHeader>
                      <div className="flex items-center gap-2">
                        {rec.actor.avatarUrl && (
                          <img
                            src={rec.actor.avatarUrl}
                            alt=""
                            className="size-8 rounded-full ring-2 ring-shame-crimson/30"
                          />
                        )}
                        <div>
                          <Link
                            to="/wall/$login"
                            params={{ login: rec.actor.login }}
                            className="text-sm font-medium hover:text-shame-crimson"
                          >
                            @{rec.actor.login}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {rec.banCount} bans, {rec.flagCount} flags
                          </p>
                        </div>
                      </div>
                      <ShameBadge count={rec.banCount + rec.flagCount}>
                        {rec.shouldBan ? "BAN" : rec.shouldFlag ? "FLAG" : "WATCH"}
                      </ShameBadge>
                    </StoneCardHeader>
                    <StoneCardContent>
                      <p className="text-xs text-muted-foreground">
                        {rec.shouldBan
                          ? "Meets ban threshold"
                          : rec.shouldFlag
                            ? "Meets flag threshold"
                            : "Approaching threshold"}
                      </p>
                    </StoneCardContent>
                  </StoneCard>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-lg font-display mb-3">Recent Activity</h2>
            {data.recentActivity.reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-2">
                {data.recentActivity.reports.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-card border border-border"
                  >
                    <div
                      className={`size-8 flex items-center justify-center shrink-0 ${
                        activity.action === "ban"
                          ? "bg-shame-crimson/10 text-shame-crimson"
                          : "bg-shame-gold/10 text-shame-gold"
                      }`}
                    >
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.action}</span> on{" "}
                        <Link
                          to="/wall/$login"
                          params={{ login: activity.actorLogin }}
                          className="text-shame-crimson hover:underline"
                        >
                          @{activity.actorLogin}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.reasonCode}
                        {activity.reasonText && `: ${activity.reasonText}`}
                      </p>
                      {activity.evidences.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {activity.evidences.slice(0, 2).map((e) => (
                            <a
                              key={e.id}
                              href={e.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-1.5 py-0.5 bg-muted hover:bg-muted/80 transition-instant"
                            >
                              {e.kind}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Current Enforcement */}
          <section>
            <h2 className="text-lg font-display mb-3">Current Enforcement</h2>
            {data.enforcements.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enforcement actions yet.</p>
            ) : (
              <div className="space-y-2">
                {data.enforcements.rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between p-3 bg-card border border-border"
                  >
                    <div className="flex items-center gap-2">
                      {row.actor.avatarUrl && (
                        <img src={row.actor.avatarUrl} alt="" className="size-6 rounded-full" />
                      )}
                      <Link
                        to="/wall/$login"
                        params={{ login: row.actor.login }}
                        className="text-sm hover:text-shame-crimson"
                      >
                        @{row.actor.login}
                      </Link>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 ${
                        row.status === "ban"
                          ? "bg-shame-crimson/10 text-shame-crimson"
                          : "bg-shame-gold/10 text-shame-gold"
                      }`}
                    >
                      {row.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Totals summary */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          <StatMini label="Enforcements" value={data.totals.enforcements} />
          <StatMini label="Reports" value={data.totals.reports} />
          <StatMini label="Recommendations" value={data.totals.recommendedActions} />
          <StatMini label="Policy Mode" value={data.policy?.mode ?? "inherit"} isText />
        </div>
      )}
    </div>
  );
}

function StatMini({
  label,
  value,
  isText,
}: {
  label: string;
  value: string | number;
  isText?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-display ${isText ? "text-foreground" : ""}`}>{value}</p>
    </div>
  );
}
