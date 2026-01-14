CREATE TABLE `github_installation` (
	`installation_id` integer PRIMARY KEY NOT NULL,
	`account_id` integer NOT NULL,
	`account_login` text NOT NULL,
	`account_type` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`suspended_at` integer
);
--> statement-breakpoint
CREATE INDEX `github_installation_account_idx` ON `github_installation` (`account_id`);--> statement-breakpoint
CREATE INDEX `github_installation_login_idx` ON `github_installation` (`account_login`);--> statement-breakpoint
CREATE TABLE `github_installation_repo` (
	`installation_id` integer NOT NULL,
	`github_repo_id` integer NOT NULL,
	`full_name` text NOT NULL,
	`added_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`installation_id`, `github_repo_id`),
	FOREIGN KEY (`installation_id`) REFERENCES `github_installation`(`installation_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `github_installation_repo_repo_idx` ON `github_installation_repo` (`github_repo_id`);--> statement-breakpoint
CREATE INDEX `github_installation_repo_installation_idx` ON `github_installation_repo` (`installation_id`);