import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { TheWall, type ShameEntry } from "@/components/the-wall";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const MOCK_ENTRIES: ShameEntry[] = [
  {
    id: "1",
    username: "ai-slop-merchant",
    reason: "Submitted 47 PRs in one day across 12 repos, all with identical AI-generated code that introduced security vulnerabilities.",
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
    reason: "Opened mass issues with hallucinated bug reports that wasted maintainer time investigating non-existent problems.",
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
    reason: "Posted AI-generated comments that contradicted the actual code behavior, misleading other contributors.",
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
          <div className="container mx-auto max-w-5xl px-4 py-20 md:py-32">
            <div className="text-center space-y-6">
              <h1 className="text-shame-crimson">
                The Wall of Shame
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Crowdsourced accountability for those who blindly toss AI slop over the wall onto maintainers without a nanosecond of thought.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button size="lg" className="gap-2 text-base">
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Install on GitHub
                </Button>
                <Button variant="outline" size="lg" className="text-base">
                  View The Wall
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

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
                Add bs-shame to your org or repo with one click. It watches for known bad actors automatically.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="pillory-icon mx-auto">
                <span className="font-display text-lg">2</span>
              </div>
              <h3 className="text-lg font-display">Report Offenders</h3>
              <p className="text-sm text-muted-foreground">
                When someone submits AI slop, report them. Their name goes on the crowdsourced list with evidence.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="pillory-icon mx-auto">
                <span className="font-display text-lg">3</span>
              </div>
              <h3 className="text-lg font-display">Auto-Protection</h3>
              <p className="text-sm text-muted-foreground">
                Repeat offenders get flagged, then banned across all participating repos. Three strikes, you're out.
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
            Join the network. One install protects you from the entire crowdsourced list of bad actors.
          </p>
          <Button size="lg" className="gap-2 text-base">
            <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Install on GitHub
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p className="font-display">bs-shame</p>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
