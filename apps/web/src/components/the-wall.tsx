import { Link } from "@tanstack/react-router";

import type { ShameEvidenceKind } from "@bs-shame/api/types";

import {
  StoneCard,
  StoneCardHeader,
  StoneCardTitle,
  StoneCardMeta,
  StoneCardContent,
  StoneCardFooter,
  ShameBadge,
} from "@/components/ui/stone-card";

type ShameEntry = {
  id: string;
  username: string;
  avatarUrl?: string;
  reason: string;
  reportCount: number;
  firstReported: string;
  lastReported: string;
  sources: Array<{
    repo: string;
    type: ShameEvidenceKind;
    url: string;
  }>;
};

type TheWallProps = {
  entries: ShameEntry[];
  isLoading?: boolean;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ShameEntryCard({ entry }: { entry: ShameEntry }) {
  const severityLevel =
    entry.reportCount >= 3 ? "banned" : entry.reportCount >= 2 ? "flagged" : "warned";

  return (
    <Link to="/wall/$login" params={{ login: entry.username }} className="block group">
      <StoneCard className="transition-all group-hover:border-shame-crimson/50 group-hover:shadow-md">
        <StoneCardHeader>
          <div className="flex items-center gap-3">
            {entry.avatarUrl ? (
              <img
                src={entry.avatarUrl}
                alt=""
                className="size-10 rounded-full ring-2 ring-shame-crimson/30"
              />
            ) : (
              <div className="pillory-icon">
                <svg
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
            )}
            <div>
              <StoneCardTitle>{entry.username}</StoneCardTitle>
              <StoneCardMeta>First reported {formatDate(entry.firstReported)}</StoneCardMeta>
            </div>
          </div>
          <ShameBadge count={entry.reportCount}>
            {severityLevel === "banned"
              ? "BANNED"
              : severityLevel === "flagged"
                ? "FLAGGED"
                : "WARNED"}
          </ShameBadge>
        </StoneCardHeader>

        <StoneCardContent>
          <p className="line-clamp-2">{entry.reason}</p>
        </StoneCardContent>

        <StoneCardFooter>
          <span>
            Reported in {entry.sources.length} repo{entry.sources.length !== 1 && "s"}
          </span>
          <span className="text-border">•</span>
          <span>Last: {formatDate(entry.lastReported)}</span>
        </StoneCardFooter>
      </StoneCard>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <StoneCard className="animate-pulse">
      <StoneCardHeader>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        </div>
        <div className="h-5 w-16 rounded bg-muted" />
      </StoneCardHeader>
      <StoneCardContent>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      </StoneCardContent>
      <StoneCardFooter>
        <div className="h-3 w-40 rounded bg-muted" />
      </StoneCardFooter>
    </StoneCard>
  );
}

export function TheWall({ entries, isLoading }: TheWallProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 medieval-border">
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
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="font-display text-xl mb-2">The Wall Stands Empty</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          No bad actors have been reported yet. Install bs-shame on your repos to start building the
          crowdsourced list.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((entry) => (
        <ShameEntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

export type { ShameEntry };
