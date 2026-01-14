export type ReportWithMeta = {
	id: string;
	action: "flag" | "ban";
	scope: "org" | "repo";
	scopeGithubId: number;
	createdAt: Date;
	repoStars?: number;
	repoContributors?: number;
	reporterIsMaintainer: boolean;
};

function groupBy<T>(
	items: T[],
	keyFn: (item: T) => string,
): Record<string, T[]> {
	return items.reduce(
		(acc, item) => {
			const key = keyFn(item);
			if (!acc[key]) {
				acc[key] = [];
			}
			acc[key].push(item);
			return acc;
		},
		{} as Record<string, T[]>,
	);
}

function sortBy<T>(items: T[], keyFn: (item: T) => Date): T[] {
	return [...items].sort((a, b) => keyFn(a).getTime() - keyFn(b).getTime());
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function computeReportWeight(r: ReportWithMeta): number {
	const actionWeight = r.action === "ban" ? 1.0 : 0.6;

	// Log-scale star factor (0 stars = 0.2, 10k stars = 1.0)
	const starsFactor = clamp(Math.log10((r.repoStars ?? 0) + 1) / 4, 0.2, 1.0);

	// Log-scale contributor factor
	const contributorsFactor = clamp(
		Math.log10((r.repoContributors ?? 0) + 1) / 3,
		0.2,
		1.0,
	);

	// Age decay (~83 day half-life)
	const ageDays = (Date.now() - r.createdAt.getTime()) / 86400000;
	const ageFactor = Math.exp(-ageDays / 120);

	// Maintainer reports worth more
	const maintainerMultiplier = r.reporterIsMaintainer ? 1.5 : 1.0;

	return (
		actionWeight *
		starsFactor *
		contributorsFactor *
		ageFactor *
		maintainerMultiplier
	);
}

export function computeActorScore(reports: ReportWithMeta[]): number {
	// Group by scope to apply diminishing returns
	const byScope = groupBy(reports, (r) => `${r.scope}:${r.scopeGithubId}`);

	let totalScore = 0;
	for (const scopeReports of Object.values(byScope)) {
		// Sort by date, apply diminishing multipliers
		const sorted = sortBy(scopeReports, (r) => r.createdAt);
		const diminishing = [1.0, 0.35, 0.15, 0.05]; // 2nd+ reports from same scope worth less

		sorted.forEach((report, i) => {
			const diminishFactor =
				diminishing[Math.min(i, diminishing.length - 1)] ?? 0.05;
			totalScore += computeReportWeight(report) * diminishFactor;
		});
	}

	// Diversity bonus: reports from different scopes
	const distinctScopes = Object.keys(byScope).length;
	const diversityBonus = 1 + 0.15 * (distinctScopes - 1);

	return totalScore * diversityBonus;
}
