import { createFileRoute, Link } from "@tanstack/react-router";

import { useDashboardScope } from "@/components/scope-picker";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/reports")({
  component: DashboardReportsPage,
});

function DashboardReportsPage() {
  const { installationId, installation } = useDashboardScope();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {installation
              ? `Reports for ${installation.accountLogin}`
              : "Select an installation to file a report."}
          </p>
        </div>
        <Link to="/dashboard/reports/new">
          <Button size="sm" disabled={!installationId}>New Report</Button>
        </Link>
      </div>

      <div className="text-center py-16 bg-muted/30 border border-dashed border-border">
        <div className="pillory-icon mx-auto mb-4">
          <svg
            className="size-6"
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
        <h2 className="text-lg font-display mb-2">No reports yet</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Reports are collected per repo or organization. File a report from a GitHub issue or PR
          to start building your enforcement history.
        </p>
      </div>
    </div>
  );
}
