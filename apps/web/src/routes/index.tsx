import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { TheWall, type ShameEntry } from "@/components/the-wall";
import { ThemeSwitcher } from "@/components/theme-switcher";

import { GithubIcon } from "@/components/icons/github";
import { GateAnimation } from "@/components/gate-animation";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const MOCK_ENTRIES: ShameEntry[] = [
  {
    id: "1",
    username: "ai-slop-merchant",
    reason:
      "Submitted 47 PRs in one day across 12 repos, all with identical AI-generated code that introduced security vulnerabilities.",
    reportCount: 3,
    firstReported: "2025-12-01",
    lastReported: "2026-01-10",
    sources: [
      { repo: "facebook/react", type: "pr", url: "#" },
      { repo: "vercel/next.js", type: "pr", url: "#" },
      { repo: "microsoft/vscode", type: "pr", url: "#" },
    ],
  },
  {
    id: "2",
    username: "copilot-cowboy",
    reason:
      "Opened mass issues with hallucinated bug reports that wasted maintainer time investigating non-existent problems.",
    reportCount: 2,
    firstReported: "2025-11-15",
    lastReported: "2026-01-08",
    sources: [
      { repo: "golang/go", type: "issue", url: "#" },
      { repo: "rust-lang/rust", type: "issue", url: "#" },
    ],
  },
  {
    id: "3",
    username: "gpt-and-forget",
    reason:
      "Posted AI-generated comments that contradicted the actual code behavior, misleading other contributors.",
    reportCount: 1,
    firstReported: "2026-01-05",
    lastReported: "2026-01-05",
    sources: [{ repo: "nodejs/node", type: "comment", url: "#" }],
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden texture-parchment">
        <div className="medieval-border">
          <div className="container mx-auto max-w-5xl px-4 pt-28 pb-20 md:pt-36 md:pb-32">
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
                <Button variant="medieval" size="xl" className="text-base px-6 -bg-linear-180">
                  View The Wall
                </Button>
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
          <TheWall entries={MOCK_ENTRIES} />
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
