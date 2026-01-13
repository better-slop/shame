import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/dashboard-layout";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/dashboard")({
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
  component: DashboardLayoutRoute,
});

function DashboardLayoutRoute() {
  const { session } = Route.useRouteContext();

  return (
    <DashboardLayout user={session?.user}>
      <Outlet />
    </DashboardLayout>
  );
}
