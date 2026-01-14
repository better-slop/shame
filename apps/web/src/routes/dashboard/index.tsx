import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard/")(
{
  component: DashboardOverview,
});

function DashboardOverview() {
  const trpc = useTRPC();
  const privateData = useQuery(trpc.privateData.queryOptions());
  const [showReportForm, setShowReportForm] = useState(false);
  const [showPolicyForm, setShowPolicyForm] = useState(false);

  // TODO: Replace with actual org/repo IDs from user context
  const githubOwnerId = 123456;
  const dashboardData = useQuery(
    trpc.shame.org.dashboard.queryOptions({
      githubOwnerId,
    }),
  );

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Protected Repos" value="12" />
        <StatCard label="Bad Actors Blocked" value="47" trend="+3 this week" />
        <StatCard label="Reports Filed" value="8" />
        <StatCard label="Network Size" value="1,284" sublabel="repos" />
      </div>

      {/* Policy Controls Panel */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Policy Controls</h2>
          <button
            type="button"
            onClick={() => setShowPolicyForm(!showPolicyForm)}
            className="px-4 py-2 bg-shame-gold hover:bg-shame-gold/90 text-background text-sm font-medium transition-colors"
            data-testid="edit-policy"
          >
            {showPolicyForm ? "Cancel" : "Edit Policy"}
          </button>
        </div>
        {showPolicyForm && <PolicyControlsForm onSuccess={() => setShowPolicyForm(false)} />}
      </section>

      {/* Recommendations Panel */}
      <section>
        <h2 className="text-xl mb-4">Recommendations</h2>
        {dashboardData.isLoading ? (
          <div className="bg-card border border-border p-6 text-center text-muted-foreground">
            Loading recommendations...
          </div>
        ) : dashboardData.error ? (
          <div className="bg-card border border-border p-6 text-center text-red-600 dark:text-red-400">
            Error loading recommendations: {dashboardData.error.message}
          </div>
        ) : (
          <RecommendationsPanel
            recommendations={dashboardData.data?.recommendations ?? []}
            githubOwnerId={githubOwnerId}
          />
        )}
      </section>

      {/* Report Management Panel */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Report Management</h2>
          <button
            type="button"
            onClick={() => setShowReportForm(!showReportForm)}
            className="px-4 py-2 bg-shame-crimson hover:bg-shame-crimson/90 text-white text-sm font-medium transition-colors"
            data-testid="create-report"
          >
            {showReportForm ? "Cancel" : "Create Report"}
          </button>
        </div>
        {showReportForm && <CreateReportForm onSuccess={() => setShowReportForm(false)} />}
      </section>

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
        <p>API: {privateData.data?.message ?? "loading..."}</p>
      </div>
    </div>
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
      <svg
        className="size-4"
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
    ),
    report: (
      <svg
        className="size-4"
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
    ),
    install: (
      <svg
        className="size-4"
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
    ),
  };

  const colors = {
    block: "text-shame-crimson bg-shame-crimson/10",
    report: "text-shame-gold bg-shame-gold/10",
    install: "text-green-600 bg-green-600/10 dark:text-green-400 dark:bg-green-400/10",
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border">
      <div className={`size-8 flex items-center justify-center ${colors[type]}`}>{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{message}</p>
      </div>
      <p className="text-xs text-muted-foreground whitespace-nowrap">{time}</p>
    </div>
  );
}

function PolicyControlsForm({ onSuccess }: { onSuccess: () => void }) {
  const trpc = useTRPC();
  const [formData, setFormData] = useState({
    scope: "org" as "org" | "repo",
    githubOwnerId: "",
    githubRepoId: "",
    mode: "manual" as "manual" | "auto",
    flagAt: "2",
    banAt: "3",
  });

  const setPolicyOrg = useMutation(
    trpc.shame.policy.setOrg.mutationOptions({
      onSuccess: () => {
        onSuccess();
      },
    }),
  );

  const setPolicyRepo = useMutation(
    trpc.shame.policy.setRepo.mutationOptions({
      onSuccess: () => {
        onSuccess();
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.scope === "org") {
      setPolicyOrg.mutate({
        githubOwnerId: Number(formData.githubOwnerId),
        mode: formData.mode,
        flagAt: Number(formData.flagAt),
        banAt: Number(formData.banAt),
      });
    } else {
      setPolicyRepo.mutate({
        githubRepoId: Number(formData.githubRepoId),
        githubOwnerId: Number(formData.githubOwnerId),
        mode: formData.mode as "inherit" | "manual" | "auto",
        flagAt: Number(formData.flagAt),
        banAt: Number(formData.banAt),
      });
    }
  };

  const isPending = setPolicyOrg.isPending || setPolicyRepo.isPending;
  const isError = setPolicyOrg.isError || setPolicyRepo.isError;
  const isSuccess = setPolicyOrg.isSuccess || setPolicyRepo.isSuccess;
  const error = setPolicyOrg.error || setPolicyRepo.error;

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="policy-scope" className="block text-sm font-medium mb-2">
            Scope
          </label>
          <select
            id="policy-scope"
            name="scope"
            value={formData.scope}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value as "org" | "repo" })}
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-gold"
          >
            <option value="org">Organization</option>
            <option value="repo">Repository</option>
          </select>
        </div>

        <div>
          <label htmlFor="policy-mode" className="block text-sm font-medium mb-2">
            Enforcement Mode
          </label>
          <select
            id="policy-mode"
            name="mode"
            value={formData.mode}
            onChange={(e) => setFormData({ ...formData, mode: e.target.value as "manual" | "auto" })}
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-gold"
          >
            <option value="manual">Manual</option>
            <option value="auto">Auto</option>
            {formData.scope === "repo" && <option value="inherit">Inherit from Org</option>}
          </select>
        </div>

        <div>
          <label htmlFor="policy-github-owner-id" className="block text-sm font-medium mb-2">
            Organization GitHub ID
          </label>
          <input
            id="policy-github-owner-id"
            name="githubOwnerId"
            type="number"
            required
            value={formData.githubOwnerId}
            onChange={(e) => setFormData({ ...formData, githubOwnerId: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-gold"
            placeholder="123456"
          />
        </div>

        {formData.scope === "repo" && (
          <div>
            <label htmlFor="policy-github-repo-id" className="block text-sm font-medium mb-2">
              Repository GitHub ID
            </label>
            <input
              id="policy-github-repo-id"
              name="githubRepoId"
              type="number"
              required
              value={formData.githubRepoId}
              onChange={(e) => setFormData({ ...formData, githubRepoId: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-gold"
              placeholder="789012"
            />
          </div>
        )}

        <div>
          <label htmlFor="policy-flag-at" className="block text-sm font-medium mb-2">
            Flag Threshold (score points)
          </label>
          <input
            id="policy-flag-at"
            name="flagAt"
            type="number"
            required
            min="1"
            value={formData.flagAt}
            onChange={(e) => setFormData({ ...formData, flagAt: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-gold"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Flag users with this many total reports
          </p>
        </div>

        <div>
          <label htmlFor="policy-ban-at" className="block text-sm font-medium mb-2">
            Ban Threshold (score points)
          </label>
          <input
            id="policy-ban-at"
            name="banAt"
            type="number"
            required
            min="1"
            value={formData.banAt}
            onChange={(e) => setFormData({ ...formData, banAt: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-gold"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Auto-ban users with this many ban reports
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onSuccess}
          className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-shame-gold hover:bg-shame-gold/90 text-background text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving..." : "Save Policy"}
        </button>
      </div>

      {isError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          Error: {error?.message}
        </div>
      )}

      {isSuccess && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm">
          Policy saved successfully!
        </div>
      )}
    </form>
  );
}

type ReasonCode = "ai_spam" | "spam" | "harassment" | "hate" | "phishing" | "malware" | "other";

const REASON_CODE_LABELS: Record<ReasonCode, string> = {
  ai_spam: "AI Spam",
  spam: "Spam",
  harassment: "Harassment",
  hate: "Hate Speech",
  phishing: "Phishing",
  malware: "Malware",
  other: "Other",
};

function CreateReportForm({ onSuccess }: { onSuccess: () => void }) {
  const trpc = useTRPC();
  const [formData, setFormData] = useState({
    actorLogin: "",
    scope: "repo" as "org" | "repo",
    scopeGithubId: "",
    scopeLogin: "",
    action: "flag" as "flag" | "ban",
    reasonCode: "ai_spam" as ReasonCode,
    reasonText: "",
    evidenceUrls: "",
  });

  const createReport = useMutation(
    trpc.shame.report.create.mutationOptions({
      onSuccess: () => {
        onSuccess();
        setFormData({
          actorLogin: "",
          scope: "repo",
          scopeGithubId: "",
          scopeLogin: "",
          action: "flag",
          reasonCode: "ai_spam",
          reasonText: "",
          evidenceUrls: "",
        });
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const evidence = formData.evidenceUrls
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => ({
        kind: "other" as const,
        url,
      }));

    createReport.mutate({
      scope: formData.scope,
      scopeGithubId: Number(formData.scopeGithubId),
      scopeLogin: formData.scopeLogin,
      actorGithubUserId: 0, // Will be fetched from GitHub API in production
      actorLogin: formData.actorLogin,
      action: formData.action,
      reasonCode: formData.reasonCode,
      reasonText: formData.reasonText || undefined,
      evidence,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="actorLogin" className="block text-sm font-medium mb-2">
            Actor GitHub Username
          </label>
          <input
            id="actorLogin"
            name="actorLogin"
            type="text"
            required
            value={formData.actorLogin}
            onChange={(e) => setFormData({ ...formData, actorLogin: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-crimson"
            placeholder="username"
          />
        </div>

        <div>
          <label htmlFor="scope" className="block text-sm font-medium mb-2">
            Scope
          </label>
          <select
            id="scope"
            name="scope"
            value={formData.scope}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value as "org" | "repo" })}
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-crimson"
          >
            <option value="repo">Repository</option>
            <option value="org">Organization</option>
          </select>
        </div>

        <div>
          <label htmlFor="scopeGithubId" className="block text-sm font-medium mb-2">
            {formData.scope === "repo" ? "Repository" : "Organization"} GitHub ID
          </label>
          <input
            id="scopeGithubId"
            name="scopeGithubId"
            type="number"
            required
            value={formData.scopeGithubId}
            onChange={(e) => setFormData({ ...formData, scopeGithubId: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-crimson"
            placeholder="123456"
          />
        </div>

        <div>
          <label htmlFor="scopeLogin" className="block text-sm font-medium mb-2">
            {formData.scope === "repo" ? "Repository" : "Organization"} Login/Name
          </label>
          <input
            id="scopeLogin"
            name="scopeLogin"
            type="text"
            required
            value={formData.scopeLogin}
            onChange={(e) => setFormData({ ...formData, scopeLogin: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-crimson"
            placeholder="owner/repo or org-name"
          />
        </div>

        <div>
          <label htmlFor="action" className="block text-sm font-medium mb-2">
            Action
          </label>
          <select
            id="action"
            name="action"
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value as "flag" | "ban" })}
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-crimson"
          >
            <option value="flag">Flag</option>
            <option value="ban">Ban</option>
          </select>
        </div>

        <div>
          <label htmlFor="reasonCode" className="block text-sm font-medium mb-2">
            Reason
          </label>
          <select
            id="reasonCode"
            name="reasonCode"
            value={formData.reasonCode}
            onChange={(e) => setFormData({ ...formData, reasonCode: e.target.value as ReasonCode })}
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-crimson"
          >
            {Object.entries(REASON_CODE_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="reasonText" className="block text-sm font-medium mb-2">
          Additional Details (optional)
        </label>
        <textarea
          id="reasonText"
          name="reasonText"
          value={formData.reasonText}
          onChange={(e) => setFormData({ ...formData, reasonText: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-crimson"
          rows={3}
          placeholder="Provide additional context..."
        />
      </div>

      <div>
        <label htmlFor="evidenceUrls" className="block text-sm font-medium mb-2">
          Evidence URLs (one per line)
        </label>
        <textarea
          id="evidenceUrls"
          name="evidenceUrls"
          value={formData.evidenceUrls}
          onChange={(e) => setFormData({ ...formData, evidenceUrls: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-crimson font-mono text-sm"
          rows={4}
          placeholder="https://github.com/owner/repo/pull/123&#10;https://github.com/owner/repo/issues/456"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onSuccess}
          className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createReport.isPending}
          className="px-4 py-2 bg-shame-crimson hover:bg-shame-crimson/90 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createReport.isPending ? "Creating..." : "Create Report"}
        </button>
      </div>

      {createReport.isError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          Error: {createReport.error.message}
        </div>
      )}

      {createReport.isSuccess && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm">
          Report created successfully!
        </div>
      )}
    </form>
  );
}

type Recommendation = {
  actor: {
    githubUserId: number;
    login: string;
    avatarUrl: string | null;
  };
  banCount: number;
  flagCount: number;
  shouldBan: boolean;
  shouldFlag: boolean;
};

function RecommendationsPanel({
  recommendations,
  githubOwnerId,
}: {
  recommendations: Recommendation[];
  githubOwnerId: number;
}) {
  const trpc = useTRPC();
  const [dismissedActors, setDismissedActors] = useState<Set<number>>(new Set());

  const setEnforcement = useMutation(
    trpc.shame.enforcement.set.mutationOptions({
      onSuccess: (_, variables) => {
        setDismissedActors((prev) => new Set(prev).add(variables.actorGithubUserId));
      },
    }),
  );

  const filteredRecommendations = recommendations.filter(
    (rec) => !dismissedActors.has(rec.actor.githubUserId),
  );

  if (filteredRecommendations.length === 0) {
    return (
      <div className="bg-card border border-border p-6 text-center text-muted-foreground">
        No recommendations at this time. All actors are below policy thresholds.
      </div>
    );
  }

  const handleAction = (rec: Recommendation, action: "flag" | "ban") => {
    setEnforcement.mutate({
      scope: "org",
      scopeGithubId: githubOwnerId,
      scopeLogin: "", // TODO: Get from context
      actorGithubUserId: rec.actor.githubUserId,
      actorLogin: rec.actor.login,
      status: action,
      source: "manual",
    });
  };

  const handleDismiss = (actorGithubUserId: number) => {
    setDismissedActors((prev) => new Set(prev).add(actorGithubUserId));
  };

  return (
    <div className="bg-card border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Actor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRecommendations.map((rec) => (
              <tr key={rec.actor.githubUserId} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {rec.actor.avatarUrl ? (
                      <img
                        src={rec.actor.avatarUrl}
                        alt={rec.actor.login}
                        className="size-8 rounded-full"
                      />
                    ) : (
                      <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          {rec.actor.login[0]?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{rec.actor.login}</p>
                      <p className="text-xs text-muted-foreground">ID: {rec.actor.githubUserId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Bans:</span>
                      <span className="text-sm font-medium text-shame-crimson">
                        {rec.banCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Flags:</span>
                      <span className="text-sm font-medium text-shame-gold">{rec.flagCount}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {rec.shouldBan && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-shame-crimson/10 text-shame-crimson border border-shame-crimson/30">
                        Should Ban
                      </span>
                    )}
                    {rec.shouldFlag && !rec.shouldBan && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-shame-gold/10 text-shame-gold border border-shame-gold/30">
                        Should Flag
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {rec.shouldFlag && (
                      <button
                        type="button"
                        onClick={() => handleAction(rec, "flag")}
                        disabled={setEnforcement.isPending}
                        className="px-3 py-1 text-xs font-medium bg-shame-gold hover:bg-shame-gold/90 text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="flag-actor"
                      >
                        Flag
                      </button>
                    )}
                    {rec.shouldBan && (
                      <button
                        type="button"
                        onClick={() => handleAction(rec, "ban")}
                        disabled={setEnforcement.isPending}
                        className="px-3 py-1 text-xs font-medium bg-shame-crimson hover:bg-shame-crimson/90 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="ban-actor"
                      >
                        Ban
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDismiss(rec.actor.githubUserId)}
                      className="px-3 py-1 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
                      data-testid="dismiss-actor"
                    >
                      Dismiss
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {setEnforcement.isError && (
        <div className="p-3 bg-red-500/10 border-t border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          Error: {setEnforcement.error.message}
        </div>
      )}

      {setEnforcement.isSuccess && (
        <div className="p-3 bg-green-500/10 border-t border-green-500/30 text-green-600 dark:text-green-400 text-sm">
          Enforcement action applied successfully!
        </div>
      )}
    </div>
  );
}
