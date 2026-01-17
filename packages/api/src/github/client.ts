import { z } from "zod";

const GITHUB_API_BASE_URL = "https://api.github.com";

export type GithubAuth = {
  token: string;
  type: "token" | "bearer";
};

type GithubRequestOptions<T> = {
  auth: GithubAuth;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  schema: z.ZodType<T>;
};

function buildAuthHeader(auth: GithubAuth): string {
  return auth.type === "bearer" ? `Bearer ${auth.token}` : `token ${auth.token}`;
}

export async function githubRequest<T>(options: GithubRequestOptions<T>): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE_URL}${options.path}`, {
    method: options.method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: buildAuthHeader(options.auth),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text}`);
  }

  const json = await response.json();
  return options.schema.parse(json);
}

export async function githubRequestWithHeaders<T>(
  options: GithubRequestOptions<T>,
): Promise<{ data: T; headers: Headers }> {
  const response = await fetch(`${GITHUB_API_BASE_URL}${options.path}`, {
    method: options.method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: buildAuthHeader(options.auth),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text}`);
  }

  const json = await response.json();
  return { data: options.schema.parse(json), headers: response.headers };
}

export function createGithubClient(auth: GithubAuth) {
  return {
    request: <T>(options: Omit<GithubRequestOptions<T>, "auth">) =>
      githubRequest({ ...options, auth }),
    requestWithHeaders: <T>(options: Omit<GithubRequestOptions<T>, "auth">) =>
      githubRequestWithHeaders({ ...options, auth }),
  };
}
