import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { TheWall } from "@/components/the-wall";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AsciiRenderer } from "@/components/ascii-render";

import { GithubIcon } from "@/components/icons/github";
import { GateAnimation } from "@/components/gate-animation";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.shame.wall.list.queryOptions({ limit: 3, offset: 0, sort: "recent" }),
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden texture-parchment">
        <Suspense fallback={null}>
          <AsciiRenderer className="absolute top-0 right-0 w-[400px] h-full opacity-20 pointer-events-none hidden md:block" />
        </Suspense>
        <div className="medieval-border">
          <div className="container relative z-10 mx-auto max-w-5xl px-4 pt-28 pb-20 md:pt-36 md:pb-32">
            <div className="text-center space-y-6">
              <h1 className="text-shame-crimson">The Wall of Shame</h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Crowdsourced accountability for those who blindly toss AI slop over the wall onto
                maintainers without a nanosecond of thought.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button variant="medieval" size="lg" className="gap-2 text-base px-6">
                  <GithubIcon className="size-5" />
                  Install on GitHub
                </Button>
                <Link to="/wall">
                  <Button variant="medieval" size="xl" className="text-base px-6 -bg-linear-180">
                    View The Wall
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Gate Animation */}
      <section className="py-16 md:py-24 bg-card overflow-hidden">
        <div className="container mx-auto max-w-5xl px-4">
          <GateAnimation />
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="pillory-icon mx-auto">
                <span className="font-display text-lg">1</span>
              </div>
              <h3 className="text-lg font-display">Install Once</h3>
              <p className="text-sm text-muted-foreground">
                Add bs-shame to your org or repo with one click. It watches for known bad actors
                automatically.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="pillory-icon mx-auto">
                <span className="font-display text-lg">2</span>
              </div>
              <h3 className="text-lg font-display">Report Offenders</h3>
              <p className="text-sm text-muted-foreground">
                When someone submits AI slop, report them. Their name goes on the crowdsourced list
                with evidence.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="pillory-icon mx-auto">
                <span className="font-display text-lg">3</span>
              </div>
              <h3 className="text-lg font-display">Auto-Protection</h3>
              <p className="text-sm text-muted-foreground">
                Repeat offenders get flagged, then banned across all participating repos. Three
                strikes, you're out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Wall Preview */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center mb-12">
            <h2 className="mb-4">The Wall</h2>
            <p className="text-muted-foreground">
              A monument to those who couldn't be bothered to think for a nanosecond.
            </p>
          </div>
          <TheWall entries={data?.entries ?? []} isLoading={isLoading} />
          <div className="text-center mt-8">
            <Link to="/wall">
              <Button variant="ghost" size="sm">
                View all entries →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-card medieval-border">
        <div className="container mx-auto max-w-2xl px-4 text-center space-y-6">
          <h2>Protect Your Repos</h2>
          <p className="text-muted-foreground">
            Join the network. One install protects you from the entire crowdsourced list of bad
            actors.
          </p>
          <Button variant="medieval" size="lg" className="gap-2 text-base px-6">
            <GithubIcon className="size-5" />
            Install on GitHub
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p className="font-display">bs-shame</p>
            <div className="flex items-center gap-4">
              <p>
                Inspired by{" "}
                <a
                  href="https://twitter.com/mitchellh"
                  className="text-foreground hover:text-shame-crimson transition-instant"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @mitchellh
                </a>
              </p>
              <span className="text-border">|</span>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
