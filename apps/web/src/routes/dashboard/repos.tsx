import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/repos")({
  component: DashboardReposPage,
});

function DashboardReposPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">Repositories</h1>
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
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-display mb-2">Coming Soon</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Manage repositories protected by bs-shame. This feature requires GitHub App installation
          data.
        </p>
      </div>
    </div>
  );
}
