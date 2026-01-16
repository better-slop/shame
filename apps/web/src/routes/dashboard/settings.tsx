import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import type { ShameRepoPolicyMode } from "@bs-shame/api/types";

import { useDashboardScope } from "@/components/scope-picker";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard/settings")({
  component: DashboardSettingsPage,
});

const MODE_LABELS: Record<ShameRepoPolicyMode, string> = {
  inherit: "Inherit from parent",
  manual: "Manual only",
  auto: "Auto-enforce",
};

function DashboardSettingsPage() {
  const trpc = useTRPC();
  const { installation, installationId, repoId } = useDashboardScope();

  const policyQuery = useQuery({
    ...trpc.shame.policy.getEffective.queryOptions({
      githubOwnerId: installation?.accountId ?? 0,
      githubRepoId: repoId ?? undefined,
    }),
    enabled: Boolean(installationId),
  });

  const { data, isLoading, error } = policyQuery;

  if (!installationId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display">Policy Settings</h1>
        <div className="text-center py-12 text-muted-foreground">
          <p>Select an installation to view policy settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">Policy Settings</h1>

      {isLoading && (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted" />
          <div className="h-24 bg-muted" />
        </div>
      )}

      {error && (
        <div className="p-4 border border-shame-crimson/50 bg-shame-crimson/10 text-shame-crimson">
          Failed to load policy: {error.message}
        </div>
      )}

      {data && (
        <div className="space-y-8">
          <section className="bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display">Effective Policy</h2>
              <span className="text-xs px-2 py-1 bg-muted text-muted-foreground uppercase">
                Source: {data.source}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <PolicyField label="Mode" value={MODE_LABELS[data.mode] ?? data.mode} />
              <PolicyField label="Flag Threshold" value={`${data.flagAt} reports`} />
              <PolicyField label="Ban Threshold" value={`${data.banAt} reports`} />
              <PolicyField
                label="Status"
                value={data.source === "repo" ? "Using repo override" : "Using org defaults"}
              />
            </div>
          </section>

          {data.orgPolicy && (
            <section className="bg-card border border-border p-6">
              <h2 className="text-lg font-display mb-4">Organization Policy</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <PolicyField
                  label="Mode"
                  value={MODE_LABELS[data.orgPolicy.mode] ?? data.orgPolicy.mode}
                />
                <PolicyField label="Flag At" value={`${data.orgPolicy.flagAt} reports`} />
                <PolicyField label="Ban At" value={`${data.orgPolicy.banAt} reports`} />
              </div>
            </section>
          )}

          {repoId && (
            <section className="bg-card border border-border p-6">
              <h2 className="text-lg font-display mb-4">Repository Override</h2>
              {data.repoPolicy ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <PolicyField
                    label="Mode"
                    value={MODE_LABELS[data.repoPolicy.mode] ?? data.repoPolicy.mode}
                  />
                  <PolicyField label="Flag At" value={`${data.repoPolicy.flagAt} reports`} />
                  <PolicyField label="Ban At" value={`${data.repoPolicy.banAt} reports`} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No repository-specific policy. Using organization defaults.
                </p>
              )}
            </section>
          )}

          <section className="bg-muted/30 border border-dashed border-border p-6">
            <h2 className="text-lg font-display mb-2">Edit Policy</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Policy editing requires mutation endpoints. Coming soon.
            </p>
            <div className="flex gap-2">
              <Button variant="medieval" size="sm" disabled>
                Edit Org Policy
              </Button>
              {repoId && (
                <Button variant="ghost" size="sm" disabled>
                  Set Repo Override
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function PolicyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}
