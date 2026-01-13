import { z } from "zod";

type ScopePickerProps = {
  ownerId: number | null;
  repoId: number | null;
  onOwnerChange: (id: number | null) => void;
  onRepoChange: (id: number | null) => void;
};

export function ScopePicker({ ownerId, repoId, onOwnerChange, onRepoChange }: ScopePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 border border-border mb-6">
      <label className="text-xs text-muted-foreground uppercase tracking-wide">Scope:</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Owner ID"
          value={ownerId ?? ""}
          onChange={(e) => onOwnerChange(e.target.value ? Number(e.target.value) : null)}
          className="w-28 px-2 py-1 text-sm bg-background border border-border focus:border-shame-crimson focus:outline-none"
        />
        <input
          type="number"
          placeholder="Repo ID (optional)"
          value={repoId ?? ""}
          onChange={(e) => onRepoChange(e.target.value ? Number(e.target.value) : null)}
          className="w-36 px-2 py-1 text-sm bg-background border border-border focus:border-shame-crimson focus:outline-none"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Enter GitHub IDs manually. Install selection coming soon.
      </p>
    </div>
  );
}

export const dashboardSearchSchema = z.object({
  ownerId: z.coerce.number().optional(),
  repoId: z.coerce.number().optional(),
});

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;
