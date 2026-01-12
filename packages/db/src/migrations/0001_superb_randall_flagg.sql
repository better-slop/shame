CREATE TABLE `shame_actor` (
	`github_user_id` integer PRIMARY KEY NOT NULL,
	`login` text NOT NULL,
	`display_name` text,
	`avatar_url` text,
	`profile_url` text,
	`type` text DEFAULT 'unknown' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `shame_actor_login_idx` ON `shame_actor` (`login`);--> statement-breakpoint
CREATE TABLE `shame_actor_login` (
	`actor_github_user_id` integer NOT NULL,
	`login` text NOT NULL,
	`first_seen_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`last_seen_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`actor_github_user_id`, `login`),
	FOREIGN KEY (`actor_github_user_id`) REFERENCES `shame_actor`(`github_user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `shame_actor_login_actor_idx` ON `shame_actor_login` (`actor_github_user_id`);--> statement-breakpoint
CREATE INDEX `shame_actor_login_login_idx` ON `shame_actor_login` (`login`);--> statement-breakpoint
CREATE TABLE `shame_enforcement` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`scope_github_id` integer NOT NULL,
	`scope_login` text NOT NULL,
	`actor_github_user_id` integer NOT NULL,
	`actor_login` text NOT NULL,
	`status` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_by_user_id` text,
	`revoked_by_user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`actor_github_user_id`) REFERENCES `shame_actor`(`github_user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`revoked_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shame_enforcement_scope_actor_unq` ON `shame_enforcement` (`scope`,`scope_github_id`,`actor_github_user_id`);--> statement-breakpoint
CREATE INDEX `shame_enforcement_actor_idx` ON `shame_enforcement` (`actor_github_user_id`);--> statement-breakpoint
CREATE INDEX `shame_enforcement_scope_idx` ON `shame_enforcement` (`scope`,`scope_github_id`);--> statement-breakpoint
CREATE INDEX `shame_enforcement_active_idx` ON `shame_enforcement` (`active`);--> statement-breakpoint
CREATE TABLE `shame_evidence` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` text NOT NULL,
	`kind` text DEFAULT 'other' NOT NULL,
	`url` text NOT NULL,
	`github_repo_id` integer,
	`github_number` integer,
	`github_comment_id` integer,
	`github_node_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `shame_report`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `shame_evidence_report_idx` ON `shame_evidence` (`report_id`);--> statement-breakpoint
CREATE INDEX `shame_evidence_repo_idx` ON `shame_evidence` (`github_repo_id`);--> statement-breakpoint
CREATE TABLE `shame_policy_org` (
	`github_owner_id` integer PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'manual' NOT NULL,
	`flag_at` integer DEFAULT 2 NOT NULL,
	`ban_at` integer DEFAULT 3 NOT NULL,
	`created_by_user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `shame_policy_org_mode_idx` ON `shame_policy_org` (`mode`);--> statement-breakpoint
CREATE TABLE `shame_policy_repo` (
	`github_repo_id` integer PRIMARY KEY NOT NULL,
	`github_owner_id` integer NOT NULL,
	`mode` text DEFAULT 'inherit' NOT NULL,
	`flag_at` integer DEFAULT 2 NOT NULL,
	`ban_at` integer DEFAULT 3 NOT NULL,
	`created_by_user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `shame_policy_repo_owner_idx` ON `shame_policy_repo` (`github_owner_id`);--> statement-breakpoint
CREATE INDEX `shame_policy_repo_mode_idx` ON `shame_policy_repo` (`mode`);--> statement-breakpoint
CREATE TABLE `shame_report` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`scope_github_id` integer NOT NULL,
	`scope_login` text NOT NULL,
	`actor_github_user_id` integer NOT NULL,
	`actor_login` text NOT NULL,
	`action` text NOT NULL,
	`reason_code` text NOT NULL,
	`reason_text` text,
	`visibility` text DEFAULT 'public' NOT NULL,
	`created_by_user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`actor_github_user_id`) REFERENCES `shame_actor`(`github_user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shame_report_scope_actor_unq` ON `shame_report` (`scope`,`scope_github_id`,`actor_github_user_id`);--> statement-breakpoint
CREATE INDEX `shame_report_actor_idx` ON `shame_report` (`actor_github_user_id`);--> statement-breakpoint
CREATE INDEX `shame_report_scope_idx` ON `shame_report` (`scope`,`scope_github_id`);--> statement-breakpoint
CREATE INDEX `shame_report_created_at_idx` ON `shame_report` (`created_at`);