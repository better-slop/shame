import { z } from "zod";

import { githubRequest } from "./client";

type GithubAppCredentials = {
  appId: string;
  privateKey: string;
};

const jwtHeader = {
  alg: "RS256",
  typ: "JWT",
};

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeJson(value: object): string {
  const json = JSON.stringify(value);
  return base64UrlEncode(encoder.encode(json));
}

function decodePem(pem: string): Uint8Array {
  const normalized = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importPrivateKey(privateKey: string): Promise<CryptoKey> {
  const bytes = decodePem(privateKey);
  return crypto.subtle.importKey(
    "pkcs8",
    bytes,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
}

export async function createAppJwt(credentials: GithubAppCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: credentials.appId,
  };

  const encodedHeader = encodeJson(jwtHeader);
  const encodedPayload = encodeJson(payload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = await importPrivateKey(credentials.privateKey);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(signingInput),
  );
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
}

const installationTokenSchema = z.object({
  token: z.string(),
  expires_at: z.string(),
});

export async function createInstallationToken(options: {
  installationId: number;
  credentials: GithubAppCredentials;
}) {
  const jwt = await createAppJwt(options.credentials);
  return githubRequest({
    auth: { token: jwt, type: "bearer" },
    method: "POST",
    path: `/app/installations/${options.installationId}/access_tokens`,
    schema: installationTokenSchema,
  });
}
