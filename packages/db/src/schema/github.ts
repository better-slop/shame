import { relations, sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

const msNow = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const githubAccountTypeEnum = ["User", "Organization"] as const;
export type GithubAccountType = (typeof githubAccountTypeEnum)[number];

export const githubInstallation = sqliteTable(
  "github_installation",
  {
    installationId: integer("installation_id").primaryKey(),
    accountId: integer("account_id").notNull(),
    accountLogin: text("account_login").notNull(),
    accountType: text("account_type", { enum: githubAccountTypeEnum }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(msNow).notNull(),
    suspendedAt: integer("suspended_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("github_installation_account_idx").on(table.accountId),
    index("github_installation_login_idx").on(table.accountLogin),
  ],
);

export const githubInstallationRepo = sqliteTable(
  "github_installation_repo",
  {
    installationId: integer("installation_id")
      .notNull()
      .references(() => githubInstallation.installationId, { onDelete: "cascade" }),
    githubRepoId: integer("github_repo_id").notNull(),
    fullName: text("full_name").notNull(),
    addedAt: integer("added_at", { mode: "timestamp_ms" }).default(msNow).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.installationId, table.githubRepoId] }),
    index("github_installation_repo_repo_idx").on(table.githubRepoId),
    index("github_installation_repo_installation_idx").on(table.installationId),
  ],
);

export const githubInstallationRelations = relations(githubInstallation, ({ many }) => ({
  repos: many(githubInstallationRepo),
}));

export const githubInstallationRepoRelations = relations(githubInstallationRepo, ({ one }) => ({
  installation: one(githubInstallation, {
    fields: [githubInstallationRepo.installationId],
    references: [githubInstallation.installationId],
  }),
}));
