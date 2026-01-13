import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/reports")({
  component: DashboardReportsPage,
});

function DashboardReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">Reports</h1>
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
        <h2 className="text-lg font-display mb-2">Coming Soon</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          View and manage reports filed against bad actors. This feature is under development.
        </p>
      </div>
    </div>
  );
}
