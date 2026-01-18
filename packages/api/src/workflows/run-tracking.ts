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

export const workflowRunSchema = z.object({
  type: workflowRunTypeSchema,
  status: workflowRunStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  reportId: z.string().optional(),
});

export type WorkflowRunRecord = z.infer<typeof workflowRunSchema>;
export type WorkflowRunStatus = z.infer<typeof workflowRunStatusSchema>;
export type WorkflowRunType = z.infer<typeof workflowRunTypeSchema>;

const WORKFLOW_RUN_TTL_SECONDS = 60 * 60 * 24 * 7;

export function workflowRunKey(instanceId: string) {
  return `workflow:run:${instanceId}`;
}

export async function getWorkflowRun(
  instanceId: string,
  namespace: KVNamespace = env.WORKFLOW_RUNS,
): Promise<WorkflowRunRecord | null> {
  const raw = await namespace.get(workflowRunKey(instanceId), { type: "json" });
  if (!raw) {
    return null;
  }
  return workflowRunSchema.parse(raw);
}

export async function setWorkflowRun(
  instanceId: string,
  record: WorkflowRunRecord,
  namespace: KVNamespace = env.WORKFLOW_RUNS,
) {
  await namespace.put(workflowRunKey(instanceId), JSON.stringify(record), {
    expirationTtl: WORKFLOW_RUN_TTL_SECONDS,
  });
}

export async function updateWorkflowRun(
  instanceId: string,
  patch: Partial<WorkflowRunRecord>,
  namespace: KVNamespace = env.WORKFLOW_RUNS,
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
  };

  await setWorkflowRun(instanceId, record, namespace);
  return record;
}

export function normalizeWorkflowStatus(status: string): WorkflowRunStatus {
  const parsed = workflowRunStatusSchema.safeParse(status);
  return parsed.success ? parsed.data : "unknown";
}
