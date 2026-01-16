import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useDashboardScope } from "@/components/scope-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard/reports/new")({
  component: DashboardReportCreatePage,
});

type ReasonCode = "ai_spam" | "spam" | "harassment" | "hate" | "phishing" | "malware" | "other";

type ReportFormState = {
  githubUrl: string;
  action: "flag" | "ban";
  reasonCode: ReasonCode;
  reasonText: string;
};

const REASON_CODE_LABELS: Record<ReasonCode, string> = {
  ai_spam: "AI Spam",
  spam: "Spam",
  harassment: "Harassment",
  hate: "Hate Speech",
  phishing: "Phishing",
  malware: "Malware",
  other: "Other",
};

function DashboardReportCreatePage() {
  const trpc = useTRPC();
  const navigate = useNavigate({ from: "/dashboard/reports/new" });
  const { installation, repoId } = useDashboardScope();
  const [formData, setFormData] = useState<ReportFormState>({
    githubUrl: "",
    action: "flag",
    reasonCode: "ai_spam",
    reasonText: "",
  });

  const mutation = useMutation(
    trpc.shame.report.createFromGithubUrl.mutationOptions({
      onSuccess: () => {
        navigate({ to: "/dashboard/reports" });
      },
    }),
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!installation) {
      return;
    }

    mutation.mutate({
      githubUrl: formData.githubUrl,
      action: formData.action,
      reasonCode: formData.reasonCode,
      reasonText: formData.reasonText || undefined,
      installationId: installation.installationId,
      githubRepoId: repoId ?? undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display">New Report</h1>
        <p className="text-sm text-muted-foreground">
          Paste a GitHub pull request or issue URL to file a report. Only maintainers can submit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="githubUrl">
            GitHub URL
          </label>
          <Input
            id="githubUrl"
            type="url"
            required
            value={formData.githubUrl}
            onChange={(event) => setFormData({ ...formData, githubUrl: event.target.value })}
            placeholder="https://github.com/org/repo/pull/123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="reasonCode">
            Reason
          </label>
          <select
            id="reasonCode"
            name="reasonCode"
            value={formData.reasonCode}
            onChange={(event) =>
              setFormData({ ...formData, reasonCode: event.target.value as ReasonCode })
            }
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-crimson"
          >
            {Object.entries(REASON_CODE_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="reasonText">
            Additional Details (optional)
          </label>
          <Textarea
            id="reasonText"
            value={formData.reasonText}
            onChange={(event) => setFormData({ ...formData, reasonText: event.target.value })}
            rows={4}
            placeholder="Add context for other maintainers..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="action">
            Action
          </label>
          <select
            id="action"
            name="action"
            value={formData.action}
            onChange={(event) =>
              setFormData({ ...formData, action: event.target.value as "flag" | "ban" })
            }
            className="w-full px-3 py-2 bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-shame-crimson"
          >
            <option value="flag">Flag</option>
            <option value="ban">Ban</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={mutation.isPending || !installation}>
            {mutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: "/dashboard/reports" })}
          >
            Cancel
          </Button>
        </div>

        {mutation.isError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
            Error: {mutation.error.message}
          </div>
        )}
      </form>
    </div>
  );
}
