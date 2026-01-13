import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import type { ShameEvidenceKind, ShameReasonCode } from "@bs-shame/api/types";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  StoneCard,
  StoneCardContent,
  StoneCardHeader,
  StoneCardTitle,
  ShameBadge,
} from "@/components/ui/stone-card";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/wall/$login")({
  component: ActorDetailPage,
});

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "Unknown";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(date: Date | string | null | undefined) {
  if (!date) return "Unknown";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

const REASON_LABELS: Record<ShameReasonCode, string> = {
  ai_spam: "AI Spam",
  spam: "Spam",
  harassment: "Harassment",
  hate: "Hate Speech",
  phishing: "Phishing",
  malware: "Malware",
  other: "Other",
};

const EVIDENCE_ICONS: Record<ShameEvidenceKind, string> = {
  pr: "Pull Request",
  issue: "Issue",
  comment: "Comment",
  review_comment: "Review Comment",
  commit: "Commit",
  discussion: "Discussion",
  profile: "Profile",
  other: "Link",
};

function ActorDetailPage() {
  const { login } = Route.useParams();
  const trpc = useTRPC();

  const { data, isLoading, error } = useQuery(
    trpc.shame.actor.get.queryOptions({ login, reportLimit: 50 }),
  );

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-16">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="animate-pulse space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-16">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-2xl font-display mb-4">Actor Not Found</h1>
            <p className="text-muted-foreground mb-8">
              No records found for @{login}. They might not be on the wall yet.
            </p>
            <Link to="/wall">
              <Button variant="medieval">Back to The Wall</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { actor, counts, reports } = data;
  const severityLevel =
    counts.totalBanOccurrences >= 3
      ? "banned"
      : counts.totalBanOccurrences + counts.totalFlagOccurrences >= 2
        ? "flagged"
        : "warned";

  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Actor header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            {actor.avatarUrl ? (
              <img
                src={actor.avatarUrl}
                alt=""
                className="size-20 rounded-full ring-4 ring-shame-crimson/30"
              />
            ) : (
              <div className="size-20 rounded-full bg-shame-crimson/10 flex items-center justify-center">
                <svg
                  className="size-10 text-shame-crimson"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-display">@{actor.login}</h1>
                <ShameBadge count={counts.totalBanOccurrences + counts.totalFlagOccurrences}>
                  {severityLevel.toUpperCase()}
                </ShameBadge>
              </div>
              {actor.displayName && <p className="text-muted-foreground">{actor.displayName}</p>}
              <a
                href={actor.profileUrl ?? `https://github.com/${actor.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-shame-crimson hover:underline"
              >
                View GitHub Profile
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <StatCard
              label="Ban Reports"
              value={counts.totalBanOccurrences}
              highlight={counts.totalBanOccurrences >= 3}
            />
            <StatCard label="Flag Reports" value={counts.totalFlagOccurrences} />
            <StatCard
              label="First Reported"
              value={formatRelativeTime(counts.latestReportAt)}
              sublabel={formatDate(counts.latestReportAt)}
            />
            <StatCard label="Total Reports" value={data.pagination.total} />
          </div>

          {/* Top reasons */}
          {counts.topReasonCodes.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-display mb-4">Reported For</h2>
              <div className="flex flex-wrap gap-2">
                {counts.topReasonCodes.map((r) => (
                  <span
                    key={r.code}
                    className="px-3 py-1 bg-shame-crimson/10 text-shame-crimson text-sm border border-shame-crimson/20"
                  >
                    {REASON_LABELS[r.code] ?? r.code} ({r.count})
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Report timeline */}
          <section>
            <h2 className="text-xl font-display mb-4">Report Timeline</h2>
            <div className="space-y-4">
              {reports.map((report) => (
                <StoneCard key={report.id}>
                  <StoneCardHeader>
                    <div>
                      <StoneCardTitle className="text-base">
                        {report.action === "ban" ? "Ban" : "Flag"} on {report.scopeLogin}
                      </StoneCardTitle>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(report.createdAt)} • {report.scope}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 ${
                        report.action === "ban"
                          ? "bg-shame-crimson/10 text-shame-crimson"
                          : "bg-shame-gold/10 text-shame-gold"
                      }`}
                    >
                      {report.action.toUpperCase()}
                    </span>
                  </StoneCardHeader>
                  <StoneCardContent>
                    <p className="text-sm mb-2">
                      <span className="font-medium">
                        {REASON_LABELS[report.reasonCode] ?? report.reasonCode}
                      </span>
                      {report.reasonText && `: ${report.reasonText}`}
                    </p>
                    {report.evidences.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {report.evidences.map((e) => (
                          <a
                            key={e.id}
                            href={e.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 transition-instant flex items-center gap-1"
                          >
                            <svg
                              className="size-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                              />
                            </svg>
                            {EVIDENCE_ICONS[e.kind] ?? "Link"}
                          </a>
                        ))}
                      </div>
                    )}
                  </StoneCardContent>
                </StoneCard>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="py-8 border-t border-border">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Link to="/wall" className="hover:text-foreground transition-instant">
              ← Back to The Wall
            </Link>
            <p className="font-display">bs-shame</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="relative overflow-hidden texture-parchment">
      <div className="medieval-border">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="font-display text-xl hover:text-shame-crimson transition-instant"
            >
              bs-shame
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/wall" className="text-sm hover:text-shame-crimson transition-instant">
                The Wall
              </Link>
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
  );
}

function StatCard({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-card border border-border p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p
        className={`text-2xl font-display mt-1 ${highlight ? "text-shame-crimson" : "text-foreground"}`}
      >
        {value}
      </p>
      {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
    </div>
  );
}
