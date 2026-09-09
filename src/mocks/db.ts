/**
 * Mutable in-memory store for the mock backend.
 * Cloned from fixtures so a session can create versions, trigger runs, and sync
 * without permanently mutating the source fixtures on HMR.
 */
import type {
  ExecutionDetail,
  PromptMaster,
  PromptVersion,
  SyncStatusResponse,
  WorkflowListItem,
  WorkflowTask,
} from '@/types';
import { mockPromptMasters, mockPromptVersions } from './fixtures/prompts';
import { mockWorkflows, mockWorkflowTasks, mockMappings } from './fixtures/workflows';
import { mockExecutions } from './fixtures/executions';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export const db = {
  workflows: clone(mockWorkflows) as WorkflowListItem[],
  workflowTasks: clone(mockWorkflowTasks) as Record<string, WorkflowTask[]>,
  mappings: clone(mockMappings) as typeof mockMappings,
  promptMasters: clone(mockPromptMasters) as PromptMaster[],
  promptVersions: clone(mockPromptVersions) as PromptVersion[],
  executions: clone(mockExecutions) as ExecutionDetail[],
  sync: {
    status: 'success',
    lastSyncAt: '2026-09-06T06:00:00Z',
    workflowCount: clone(mockWorkflows).length,
    added: 0,
    updated: 0,
    removed: 0,
    errors: [],
    durationMs: 3400,
  } as SyncStatusResponse,
};

// ---- derived helpers ----

export function versionsForPrompt(promptId: string): PromptVersion[] {
  return db.promptVersions
    .filter((v) => v.promptId === promptId)
    .sort((a, b) => b.version - a.version);
}

export function currentVersion(promptId: string): PromptVersion | undefined {
  return versionsForPrompt(promptId)[0];
}

export function promptListItem(master: PromptMaster) {
  const versions = versionsForPrompt(master.promptId);
  const mappedWorkflowIds = db.mappings
    .filter((m) => m.promptId === master.promptId)
    .map((m) => m.workflowId);
  return {
    ...master,
    currentVersion: versions[0]?.version ?? 0,
    versionCount: versions.length,
    mappedWorkflows: db.workflows
      .filter((w) => mappedWorkflowIds.includes(w.workflowId))
      .map((w) => ({ workflowId: w.workflowId, workflowName: w.workflowName })),
  };
}

export function nextId(prefix: string): string {
  return `${prefix}${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`;
}

export function createPromptVersion(
  promptId: string,
  promptComment: string,
  actor: string,
): PromptVersion {
  const now = new Date().toISOString();
  const nextVersion = (currentVersion(promptId)?.version ?? 0) + 1;
  const created: PromptVersion = {
    promptVersionId: nextId('pv_'),
    promptId,
    version: nextVersion,
    promptComment,
    createdAt: now,
    createdBy: actor,
    changedAt: now,
    changedBy: null,
    isCurrent: true,
  };
  db.promptVersions.push(created);
  const master = db.promptMasters.find((m) => m.promptId === promptId);
  if (master) {
    master.changedAt = now;
    master.changedBy = actor;
  }
  return created;
}
