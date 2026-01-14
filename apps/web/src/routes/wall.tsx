import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { TheWall } from "@/components/the-wall";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/wall")({
  component: WallPage,
});

function WallPage() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.shame.wall.list.queryOptions({ limit: 50, offset: 0, sort: "score" }),
  );

  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden texture-parchment">
        <div className="medieval-border">
          <div className="container mx-auto max-w-5xl px-4 py-12">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="font-display text-xl hover:text-shame-crimson transition-instant"
              >
                bs-shame
              </Link>
              <div className="flex items-center gap-4">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center mb-12">
            <h1 className="text-shame-crimson mb-4">The Wall of Shame</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A monument to those who couldn't be bothered to think for a nanosecond before dumping
              AI slop on maintainers.
            </p>
          </div>

          <TheWall entries={data?.entries ?? []} isLoading={isLoading} />

          {data && data.total > 50 && (
            <div className="text-center mt-8 text-sm text-muted-foreground">
              Showing 50 of {data.total} entries
            </div>
          )}
        </div>
      </main>

      <footer className="py-8 border-t border-border">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p className="font-display">bs-shame</p>
            <div className="flex items-center gap-4">
              <Link to="/" className="hover:text-foreground transition-instant">
                Home
              </Link>
              <span className="text-border">|</span>
              <a
                href="https://twitter.com/mitchellh"
                className="hover:text-foreground transition-instant"
                target="_blank"
                rel="noopener noreferrer"
              >
                @mitchellh
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
