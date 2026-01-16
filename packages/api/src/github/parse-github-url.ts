export type GithubUrlKind = "pull" | "issue";

export type ParsedGithubUrl = {
  owner: string;
  repo: string;
  number: number;
  kind: GithubUrlKind;
};

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);

export function parseGithubUrl(url: string): ParsedGithubUrl | null {
  if (!url.trim()) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!GITHUB_HOSTS.has(parsed.hostname)) {
    return null;
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 4) {
    return null;
  }

  const [owner, repo, type, numberText] = parts;
  if (!owner || !repo || !type || !numberText) {
    return null;
  }

  const number = Number(numberText);
  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }

  if (type === "pull") {
    return { owner, repo, number, kind: "pull" };
  }

  if (type === "issues") {
    return { owner, repo, number, kind: "issue" };
  }

  return null;
}
