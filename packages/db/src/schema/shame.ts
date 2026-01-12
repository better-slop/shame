import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

const msNow = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

const shameScopeEnum = ["org", "repo"] as const;
const shameVisibilityEnum = ["public", "private"] as const;
const shameReportActionEnum = ["flag", "ban"] as const;
const shameReasonCodeEnum = [
  "ai_spam",
  "spam",
  "harassment",
  "hate",
  "phishing",
  "malware",
  "other",
] as const;
const shameEvidenceKindEnum = [
  "pr",
  "issue",
  "comment",
  "review_comment",
  "commit",
  "discussion",
  "profile",
  "other",
] as const;
const shameOrgPolicyModeEnum = ["manual", "auto"] as const;
const shameRepoPolicyModeEnum = ["inherit", "manual", "auto"] as const;
const shameEnforcementSourceEnum = ["manual", "auto"] as const;
const shameEnforcementStatusEnum = ["flag", "ban"] as const;
const githubActorTypeEnum = ["user", "organization", "bot", "unknown"] as const;

export const shameActor = sqliteTable(
  "shame_actor",
  {
    githubUserId: integer("github_user_id").primaryKey(),
    login: text("login").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    profileUrl: text("profile_url"),
    type: text("type", { enum: githubActorTypeEnum }).notNull().default("unknown"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(msNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(msNow)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("shame_actor_login_idx").on(table.login)],
);

export const shameActorLogin = sqliteTable(
  "shame_actor_login",
  {
    actorGithubUserId: integer("actor_github_user_id")
      .notNull()
      .references(() => shameActor.githubUserId, { onDelete: "cascade" }),
    login: text("login").notNull(),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp_ms" })
      .default(msNow)
      .notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" })
      .default(msNow)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.actorGithubUserId, table.login] }),
    index("shame_actor_login_actor_idx").on(table.actorGithubUserId),
    index("shame_actor_login_login_idx").on(table.login),
  ],
);

export const shameReport = sqliteTable(
  "shame_report",
  {
    id: text("id").primaryKey(),
    scope: text("scope", { enum: shameScopeEnum }).notNull(),
    scopeGithubId: integer("scope_github_id").notNull(),
    scopeLogin: text("scope_login").notNull(),
    actorGithubUserId: integer("actor_github_user_id")
      .notNull()
      .references(() => shameActor.githubUserId, { onDelete: "cascade" }),
    actorLogin: text("actor_login").notNull(),
    action: text("action", { enum: shameReportActionEnum }).notNull(),
    reasonCode: text("reason_code", { enum: shameReasonCodeEnum }).notNull(),
    reasonText: text("reason_text"),
    visibility: text("visibility", { enum: shameVisibilityEnum })
      .notNull()
      .default("public"),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(msNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(msNow)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("shame_report_scope_actor_unq").on(
      table.scope,
      table.scopeGithubId,
      table.actorGithubUserId,
    ),
    index("shame_report_actor_idx").on(table.actorGithubUserId),
    index("shame_report_scope_idx").on(table.scope, table.scopeGithubId),
    index("shame_report_created_at_idx").on(table.createdAt),
  ],
);

export const shameEvidence = sqliteTable(
  "shame_evidence",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reportId: text("report_id")
      .notNull()
      .references(() => shameReport.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: shameEvidenceKindEnum }).notNull().default("other"),
    url: text("url").notNull(),
    githubRepoId: integer("github_repo_id"),
    githubNumber: integer("github_number"),
    githubCommentId: integer("github_comment_id"),
    githubNodeId: text("github_node_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(msNow).notNull(),
  },
  (table) => [
    index("shame_evidence_report_idx").on(table.reportId),
    index("shame_evidence_repo_idx").on(table.githubRepoId),
  ],
);

export const shamePolicyOrg = sqliteTable(
  "shame_policy_org",
  {
    githubOwnerId: integer("github_owner_id").primaryKey(),
    mode: text("mode", { enum: shameOrgPolicyModeEnum }).notNull().default("manual"),
    flagAt: integer("flag_at").notNull().default(2),
    banAt: integer("ban_at").notNull().default(3),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(msNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(msNow)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("shame_policy_org_mode_idx").on(table.mode)],
);

export const shamePolicyRepo = sqliteTable(
  "shame_policy_repo",
  {
    githubRepoId: integer("github_repo_id").primaryKey(),
    githubOwnerId: integer("github_owner_id").notNull(),
    mode: text("mode", { enum: shameRepoPolicyModeEnum }).notNull().default("inherit"),
    flagAt: integer("flag_at").notNull().default(2),
    banAt: integer("ban_at").notNull().default(3),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(msNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(msNow)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("shame_policy_repo_owner_idx").on(table.githubOwnerId),
    index("shame_policy_repo_mode_idx").on(table.mode),
  ],
);

export const shameEnforcement = sqliteTable(
  "shame_enforcement",
  {
    id: text("id").primaryKey(),
    scope: text("scope", { enum: shameScopeEnum }).notNull(),
    scopeGithubId: integer("scope_github_id").notNull(),
    scopeLogin: text("scope_login").notNull(),
    actorGithubUserId: integer("actor_github_user_id")
      .notNull()
      .references(() => shameActor.githubUserId, { onDelete: "cascade" }),
    actorLogin: text("actor_login").notNull(),
    status: text("status", { enum: shameEnforcementStatusEnum }).notNull(),
    source: text("source", { enum: shameEnforcementSourceEnum })
      .notNull()
      .default("manual"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    revokedByUserId: text("revoked_by_user_id").references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(msNow).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(msNow)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("shame_enforcement_scope_actor_unq").on(
      table.scope,
      table.scopeGithubId,
      table.actorGithubUserId,
    ),
    index("shame_enforcement_actor_idx").on(table.actorGithubUserId),
    index("shame_enforcement_scope_idx").on(table.scope, table.scopeGithubId),
    index("shame_enforcement_active_idx").on(table.active),
  ],
);

export const shameActorRelations = relations(shameActor, ({ many }) => ({
  logins: many(shameActorLogin),
  reports: many(shameReport),
  enforcements: many(shameEnforcement),
}));

export const shameActorLoginRelations = relations(shameActorLogin, ({ one }) => ({
  actor: one(shameActor, {
    fields: [shameActorLogin.actorGithubUserId],
    references: [shameActor.githubUserId],
  }),
}));

export const shameReportRelations = relations(shameReport, ({ many, one }) => ({
  actor: one(shameActor, {
    fields: [shameReport.actorGithubUserId],
    references: [shameActor.githubUserId],
  }),
  evidences: many(shameEvidence),
  createdByUser: one(user, {
    fields: [shameReport.createdByUserId],
    references: [user.id],
  }),
}));

export const shameEvidenceRelations = relations(shameEvidence, ({ one }) => ({
  report: one(shameReport, {
    fields: [shameEvidence.reportId],
    references: [shameReport.id],
  }),
}));

export const shamePolicyOrgRelations = relations(shamePolicyOrg, ({ one }) => ({
  createdByUser: one(user, {
    fields: [shamePolicyOrg.createdByUserId],
    references: [user.id],
  }),
}));

export const shamePolicyRepoRelations = relations(shamePolicyRepo, ({ one }) => ({
  createdByUser: one(user, {
    fields: [shamePolicyRepo.createdByUserId],
    references: [user.id],
  }),
}));

export const shameEnforcementRelations = relations(shameEnforcement, ({ one }) => ({
  actor: one(shameActor, {
    fields: [shameEnforcement.actorGithubUserId],
    references: [shameActor.githubUserId],
  }),
  createdByUser: one(user, {
    fields: [shameEnforcement.createdByUserId],
    references: [user.id],
  }),
  revokedByUser: one(user, {
    fields: [shameEnforcement.revokedByUserId],
    references: [user.id],
  }),
}));
