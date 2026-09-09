import type { Id, IsoDateTime, PageQuery } from './api';

/** Row from tbl_prompt_master. */
export interface PromptMaster {
  promptId: Id;
  promptName: string;
  createdAt: IsoDateTime;
  createdBy: string;
  changedAt: IsoDateTime;
  changedBy: string | null;
}

export interface MappedWorkflowRef {
  workflowId: Id;
  workflowName: string;
}

export interface PromptListItem extends PromptMaster {
  currentVersion: number;
  versionCount: number;
  mappedWorkflows: MappedWorkflowRef[];
}

export interface PromptDetail extends PromptListItem {
  /** Body (prompt_comment) of the current version, for convenience. */
  currentVersionContent: string;
}

/**
 * Row from tbl_prompt_version.
 * `promptComment` IS the prompt body (decision D2). `version` is the version number (D3).
 */
export interface PromptVersion {
  promptVersionId: Id;
  promptId: Id;
  version: number;
  promptComment: string;
  createdAt: IsoDateTime;
  createdBy: string;
  changedAt: IsoDateTime;
  changedBy: string | null;
  /** Convenience flag; else derived as version === max(version). */
  isCurrent?: boolean;
}

/** Lightweight version row without the body, for long histories. */
export type PromptVersionSummary = Omit<PromptVersion, 'promptComment'> & {
  promptComment?: string;
};

export interface CreatePromptVersionRequest {
  promptComment: string;
  /** Optional; persisted only if the backend supports it (docs/ASSUMPTIONS.md B5). */
  changeSummary?: string;
  /** Optimistic-concurrency guard; server returns 409 STALE_VERSION on mismatch. */
  baseVersion?: number;
}

export interface PromptListQuery extends PageQuery {
  search?: string;
  mappedOnly?: boolean;
}

/** Result of GET /workflows/:id/prompt. */
export interface WorkflowPromptMapping {
  mapping: {
    promptWorkflowId: Id;
    promptId: Id;
    workflowId: Id;
    createdAt: IsoDateTime;
    createdBy: string;
  };
  prompt: PromptMaster;
  currentVersion: PromptVersion;
}
