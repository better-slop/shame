import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/dashboard-layout";
import { getUser } from "@/functions/get-user";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();

  const trpc = useTRPC();
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <DashboardLayout user={session?.user}>
      <div className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Protected Repos" value="12" />
          <StatCard label="Bad Actors Blocked" value="47" trend="+3 this week" />
          <StatCard label="Reports Filed" value="8" />
          <StatCard label="Network Size" value="1,284" sublabel="repos" />
        </div>

        {/* Recent activity */}
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

        {/* Debug info */}
        <div className="text-xs text-muted-foreground p-4 bg-muted/30 border border-border">
          <p>Session: {session?.user.name}</p>
          <p>API: {privateData.data?.message ?? "loading..."}</p>
        </div>
      </div>
    </DashboardLayout>
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
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    report: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
      </svg>
    ),
    install: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      <div className={`size-8 flex items-center justify-center ${colors[type]}`}>
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{message}</p>
      </div>
      <p className="text-xs text-muted-foreground whitespace-nowrap">{time}</p>
    </div>
  );
}
