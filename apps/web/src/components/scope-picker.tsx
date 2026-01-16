import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GITHUB_APP_INSTALL_URL } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type ScopePickerProps = {
  compact?: boolean;
  className?: string;
};

type DashboardInstallation = {
  installationId: number;
  accountId: number;
  accountLogin: string;
  accountType: "User" | "Organization";
};

type DashboardRepo = {
  githubRepoId: number;
  fullName: string;
};

type DashboardScope = {
  installationId: number | null;
  repoId: number | null;
  installation: DashboardInstallation | null;
  repo: DashboardRepo | null;
  installations: DashboardInstallation[];
  repos: DashboardRepo[];
  setInstallationId: (id: number | null) => void;
  setRepoId: (id: number | null) => void;
  isLoading: boolean;
};

export function useDashboardScope(): DashboardScope {
  const search = useSearch({ from: "/dashboard" }) as DashboardSearch;
  const navigate = useNavigate({ from: "/dashboard" });
  const trpc = useTRPC();

  const installationId = search?.installationId ?? null;
  const repoId = search?.repoId ?? null;

  const installationsQuery = useQuery(trpc.shame.installations.list.queryOptions());
  const installations = (installationsQuery.data ?? []) as DashboardInstallation[];

  const normalizedInstallationId = installationId ?? null;
  const normalizedRepoId = repoId ?? null;

  const installation =
    installations.find((item) => item.installationId === normalizedInstallationId) ?? null;

  const reposQuery = useQuery({
    ...trpc.shame.installations.repos.queryOptions({
      installationId: normalizedInstallationId ?? 0,
    }),
    enabled: normalizedInstallationId !== null,
  });
  const repos = (reposQuery.data ?? []) as DashboardRepo[];

  const selectedRepo = repos.find((item) => item.githubRepoId === normalizedRepoId) ?? null;

  const setInstallationId = (id: number | null) => {
    navigate({
      search: {
        ...(search ?? {}),
        installationId: id ?? undefined,
        repoId: undefined,
      },
    });
  };

  const setRepoId = (id: number | null) => {
    navigate({
      search: {
        ...(search ?? {}),
        repoId: id ?? undefined,
      },
    });
  };

  return {
    installationId: normalizedInstallationId,
    repoId: normalizedRepoId,
    installation,
    repo: selectedRepo,
    installations,
    repos,
    setInstallationId,
    setRepoId,
    isLoading: installationsQuery.isLoading || reposQuery.isLoading,
  };
}

export function ScopePicker({ compact = false, className }: ScopePickerProps) {
  const {
    installationId,
    repoId,
    installation,
    repo,
    installations,
    repos,
    setInstallationId,
    setRepoId,
    isLoading,
  } = useDashboardScope();

  const showInstallCta = installations.length === 0 && !isLoading;
  const installationValue = installationId ? String(installationId) : undefined;
  const repoValue = repoId ? String(repoId) : "all";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        compact ? "gap-2" : "rounded-lg border border-border bg-muted/30 px-3 py-2",
        className,
      )}
      data-testid="scope-picker"
    >
      {!compact && (
        <label className="text-xs text-muted-foreground uppercase tracking-wide">Scope</label>
      )}

      <div className="flex items-center gap-2">
        <Select
          value={installationValue}
          onValueChange={(value) => {
            const parsed = Number(value);
            setInstallationId(Number.isNaN(parsed) ? null : parsed);
          }}
          disabled={isLoading || installations.length === 0}
        >
          <SelectTrigger
            size={compact ? "sm" : "default"}
            className="min-w-[12rem]"
            data-testid="scope-installation"
          >
            <SelectValue />
            {!installationValue && <span className="text-muted-foreground">Select installation</span>}
          </SelectTrigger>
          <SelectContent>
            <SelectLabel>Installations</SelectLabel>
            <SelectSeparator />
            {installations.map((item) => (
              <SelectItem key={item.installationId} value={String(item.installationId)}>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{item.accountLogin}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {item.accountType === "Organization" ? "Org" : "User"}
                  </Badge>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Select
        value={installationId ? repoValue : undefined}
        onValueChange={(value) => {
          if (value === "all") {
            setRepoId(null);
            return;
          }
          const parsed = Number(value);
          setRepoId(Number.isNaN(parsed) ? null : parsed);
        }}
        disabled={!installationId || isLoading}
      >
        <SelectTrigger
          size={compact ? "sm" : "default"}
          className="min-w-[14rem]"
          data-testid="scope-repo"
        >
          <SelectValue />
          {!repoId && <span className="text-muted-foreground">All repos</span>}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All repos</SelectItem>
          <SelectSeparator />
          {repos.map((item) => (
            <SelectItem key={item.githubRepoId} value={String(item.githubRepoId)}>
              {item.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {installation && (
        <span className="text-xs text-muted-foreground">
          {installation.accountLogin}
          {repoId && repo ? ` / ${repo.fullName.split("/")[1] ?? repo.fullName}` : ""}
        </span>
      )}

      {showInstallCta && (
        <a href={GITHUB_APP_INSTALL_URL} target="_blank" rel="noreferrer">
          <Button variant="outline" size={compact ? "sm" : "default"}>
            Install GitHub App
          </Button>
        </a>
      )}
    </div>
  );
}

export const dashboardSearchSchema = z.object({
  installationId: z.coerce.number().optional(),
  repoId: z.coerce.number().optional(),
});

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;
