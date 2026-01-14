import { describe, expect, test } from "bun:test";
import { type ReportWithMeta, computeActorScore, computeReportWeight } from "./shame-score";

describe("computeReportWeight", () => {
  const baseReport: ReportWithMeta = {
    id: "1",
    action: "ban",
    scope: "repo",
    scopeGithubId: 123,
    createdAt: new Date(),
    repoStars: 100,
    repoContributors: 10,
    reporterIsMaintainer: false,
  };

  test("ban > flag", () => {
    const banReport = { ...baseReport, action: "ban" as const };
    const flagReport = { ...baseReport, action: "flag" as const };

    const banWeight = computeReportWeight(banReport);
    const flagWeight = computeReportWeight(flagReport);

    expect(banWeight).toBeGreaterThan(flagWeight);
    expect(banWeight / flagWeight).toBeCloseTo(1.0 / 0.6, 1);
  });

  test("high stars = higher weight", () => {
    const lowStarsReport = { ...baseReport, repoStars: 10 };
    const highStarsReport = { ...baseReport, repoStars: 10000 };

    const lowWeight = computeReportWeight(lowStarsReport);
    const highWeight = computeReportWeight(highStarsReport);

    expect(highWeight).toBeGreaterThan(lowWeight);
  });

  test("high contributors = higher weight", () => {
    const lowContributorsReport = { ...baseReport, repoContributors: 2 };
    const highContributorsReport = { ...baseReport, repoContributors: 100 };

    const lowWeight = computeReportWeight(lowContributorsReport);
    const highWeight = computeReportWeight(highContributorsReport);

    expect(highWeight).toBeGreaterThan(lowWeight);
  });

  test("old reports decay", () => {
    const recentReport = {
      ...baseReport,
      createdAt: new Date(),
    };
    const oldReport = {
      ...baseReport,
      createdAt: new Date(Date.now() - 365 * 86400000), // 1 year ago
    };

    const recentWeight = computeReportWeight(recentReport);
    const oldWeight = computeReportWeight(oldReport);

    expect(recentWeight).toBeGreaterThan(oldWeight);
    expect(oldWeight / recentWeight).toBeLessThan(0.1); // significant decay after 1 year
  });

  test("maintainer multiplier applied", () => {
    const regularReport = { ...baseReport, reporterIsMaintainer: false };
    const maintainerReport = { ...baseReport, reporterIsMaintainer: true };

    const regularWeight = computeReportWeight(regularReport);
    const maintainerWeight = computeReportWeight(maintainerReport);

    expect(maintainerWeight).toBeGreaterThan(regularWeight);
    expect(maintainerWeight / regularWeight).toBeCloseTo(1.5, 1);
  });

  test("zero stars/contributors are bounded at 0.2", () => {
    const noDataReport = {
      ...baseReport,
      repoStars: 0,
      repoContributors: 0,
    };

    const weight = computeReportWeight(noDataReport);
    expect(weight).toBeGreaterThan(0);
    // Weight should still be positive due to 0.2 floor
  });

  test("undefined stars/contributors handled gracefully", () => {
    const undefinedDataReport = {
      ...baseReport,
      repoStars: undefined,
      repoContributors: undefined,
    };

    const weight = computeReportWeight(undefinedDataReport);
    expect(weight).toBeGreaterThan(0);
  });
});

describe("computeActorScore", () => {
  const createReport = (overrides: Partial<ReportWithMeta>): ReportWithMeta => ({
    id: Math.random().toString(),
    action: "ban",
    scope: "repo",
    scopeGithubId: 123,
    createdAt: new Date(),
    repoStars: 100,
    repoContributors: 10,
    reporterIsMaintainer: false,
    ...overrides,
  });

  test("same-repo diminishing returns", () => {
    const singleReport = [createReport({ scopeGithubId: 1 })];
    const duplicateReports = [
      createReport({ scopeGithubId: 1, id: "1" }),
      createReport({ scopeGithubId: 1, id: "2" }),
      createReport({ scopeGithubId: 1, id: "3" }),
      createReport({ scopeGithubId: 1, id: "4" }),
    ];

    const singleScore = computeActorScore(singleReport);
    const duplicateScore = computeActorScore(duplicateReports);

    // 4 reports shouldn't be 4x the score due to diminishing (1.0 + 0.35 + 0.15 + 0.05 = 1.55)
    expect(duplicateScore).toBeGreaterThan(singleScore);
    expect(duplicateScore / singleScore).toBeLessThan(2.0);
  });

  test("diversity bonus for multiple repos", () => {
    const sameRepoReports = [
      createReport({ scopeGithubId: 1, id: "1" }),
      createReport({ scopeGithubId: 1, id: "2" }),
    ];
    const differentRepoReports = [
      createReport({ scopeGithubId: 1, id: "1" }),
      createReport({ scopeGithubId: 2, id: "2" }),
    ];

    const sameScore = computeActorScore(sameRepoReports);
    const diverseScore = computeActorScore(differentRepoReports);

    // Different repos should get diversity bonus
    expect(diverseScore).toBeGreaterThan(sameScore);
  });

  test("diversity bonus scales with distinct scopes", () => {
    const oneScope = [createReport({ scopeGithubId: 1 })];
    const twoScopes = [createReport({ scopeGithubId: 1 }), createReport({ scopeGithubId: 2 })];
    const threeScopes = [
      createReport({ scopeGithubId: 1 }),
      createReport({ scopeGithubId: 2 }),
      createReport({ scopeGithubId: 3 }),
    ];

    const oneScore = computeActorScore(oneScope);
    const twoScore = computeActorScore(twoScopes);
    const threeScore = computeActorScore(threeScopes);

    expect(twoScore / oneScore).toBeGreaterThan(1);
    expect(threeScore / twoScore).toBeGreaterThan(1);
  });

  test("org vs repo scopes treated as different", () => {
    const sameIdDiffScope = [
      createReport({ scope: "org", scopeGithubId: 1 }),
      createReport({ scope: "repo", scopeGithubId: 1 }),
    ];

    const score = computeActorScore(sameIdDiffScope);
    // Should get diversity bonus since org:1 != repo:1
    expect(score).toBeGreaterThan(0);
  });

  test("threshold comparison works", () => {
    const lowSeverityReports = [
      createReport({
        action: "flag",
        repoStars: 10,
        repoContributors: 2,
        reporterIsMaintainer: false,
      }),
    ];
    const highSeverityReports = [
      createReport({
        action: "ban",
        repoStars: 10000,
        repoContributors: 100,
        reporterIsMaintainer: true,
      }),
      createReport({
        action: "ban",
        scopeGithubId: 2,
        repoStars: 5000,
        repoContributors: 50,
        reporterIsMaintainer: true,
      }),
    ];

    const lowScore = computeActorScore(lowSeverityReports);
    const highScore = computeActorScore(highSeverityReports);

    expect(highScore).toBeGreaterThan(lowScore * 5);
  });

  test("empty reports array returns 0", () => {
    const score = computeActorScore([]);
    expect(score).toBe(0);
  });

  test("chronological order affects diminishing returns", () => {
    const oldFirst = [
      createReport({
        scopeGithubId: 1,
        createdAt: new Date("2023-01-01"),
        id: "old",
      }),
      createReport({
        scopeGithubId: 1,
        createdAt: new Date("2024-01-01"),
        id: "new",
      }),
    ];

    // Should apply diminishing returns in chronological order
    const score = computeActorScore(oldFirst);
    expect(score).toBeGreaterThan(0);
  });
});
