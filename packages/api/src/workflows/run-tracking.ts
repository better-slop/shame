import { z } from "zod";

import { env } from "@bs-shame/env/server";

const workflowRunTypeSchema = z.enum(["report"]);
const workflowRunStatusSchema = z.enum([
  "queued",
  "running",
  "paused",
  "waiting",
  "waitingForPause",
  "complete",
  "errored",
  "terminated",
  "unknown",
]);
const workflowRunActionSchema = z.enum(["flag", "ban"]);
const workflowRunReasonSchema = z.enum([
  "ai_spam",
  "spam",
  "harassment",
  "hate",
  "phishing",
  "malware",
  "other",
]);

export const workflowRunSchema = z.object({
  type: workflowRunTypeSchema,
  status: workflowRunStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  reportId: z.string().optional(),
  action: workflowRunActionSchema.optional(),
  reasonCode: workflowRunReasonSchema.optional(),
  reasonText: z.string().optional(),
});

export type WorkflowRunRecord = z.infer<typeof workflowRunSchema>;
export type WorkflowRunStatus = z.infer<typeof workflowRunStatusSchema>;
export type WorkflowRunType = z.infer<typeof workflowRunTypeSchema>;
export type WorkflowRunAction = z.infer<typeof workflowRunActionSchema>;
export type WorkflowRunReasonCode = z.infer<typeof workflowRunReasonSchema>;

const WORKFLOW_RUN_TTL_SECONDS = 60 * 60 * 24 * 7;

export function workflowRunKey(instanceId: string) {
  return `workflow:run:${instanceId}`;
}

function resolveNamespace(namespace?: KVNamespace) {
  return namespace ?? env.WORKFLOW_RUNS;
}

export async function getWorkflowRun(
  instanceId: string,
  namespace?: KVNamespace,
): Promise<WorkflowRunRecord | null> {
  const target = resolveNamespace(namespace);
  const raw = await target.get(workflowRunKey(instanceId), { type: "json" });
  if (!raw) {
    return null;
  }
  return workflowRunSchema.parse(raw);
}

export async function setWorkflowRun(
  instanceId: string,
  record: WorkflowRunRecord,
  namespace?: KVNamespace,
) {
  const target = resolveNamespace(namespace);
  await target.put(workflowRunKey(instanceId), JSON.stringify(record), {
    expirationTtl: WORKFLOW_RUN_TTL_SECONDS,
  });
}

export async function updateWorkflowRun(
  instanceId: string,
  patch: Partial<WorkflowRunRecord>,
  namespace?: KVNamespace,
): Promise<WorkflowRunRecord> {
  const now = new Date().toISOString();
  const existing = await getWorkflowRun(instanceId, namespace);
  const type = patch.type ?? existing?.type;
  if (!type) {
    throw new Error("Workflow run type required");
  }

  const record: WorkflowRunRecord = {
    type,
    status: patch.status ?? existing?.status ?? "queued",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    reportId: patch.reportId ?? existing?.reportId,
    action: patch.action ?? existing?.action,
    reasonCode: patch.reasonCode ?? existing?.reasonCode,
    reasonText: patch.reasonText ?? existing?.reasonText,
  };

  await setWorkflowRun(instanceId, record, namespace);
  return record;
}

export function normalizeWorkflowStatus(status: string): WorkflowRunStatus {
  const parsed = workflowRunStatusSchema.safeParse(status);
  return parsed.success ? parsed.data : "unknown";
}
