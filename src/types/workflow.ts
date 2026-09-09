import type { Id, IsoDateTime, PageQuery } from './api';

export interface MappedPromptRef {
  promptId: Id;
  promptName: string;
  currentVersion: number;
}

/** Row from tbl_workflow_master enriched with live n8n data. */
export interface WorkflowListItem {
  workflowId: Id;
  workflowName: string;
  /** n8n's native workflow id (docs/ASSUMPTIONS.md C2). */
  n8nWorkflowId?: string;
  active?: boolean;
  updatedAt?: IsoDateTime;
  createdAt: IsoDateTime;
  createdBy: string;
  changedAt: IsoDateTime;
  changedBy: string | null;
  mappedPrompt: MappedPromptRef | null;
  tags?: string[];
}

export interface WorkflowDetail extends WorkflowListItem {
  description?: string;
  taskCount?: number;
  n8n?: {
    nodes?: number;
    triggerType?: string;
    versionId?: string;
  };
}

/** Row from tbl_workflow_task. */
export interface WorkflowTask {
  taskId: Id;
  taskName: string;
  nodeName: string | null;
  workflowId: Id;
  createdAt: IsoDateTime;
  createdBy: string;
  changedAt: IsoDateTime;
  changedBy: string | null;
}

export interface WorkflowListQuery extends PageQuery {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  hasPrompt?: boolean;
}

/** Field descriptor for the "Run workflow" dialog (docs/ASSUMPTIONS.md C5). */
export interface ExecutionInputField {
  name: string;
  label?: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'json';
  required: boolean;
  options?: string[];
  default?: unknown;
  description?: string;
}

export interface ExecutionInputSchema {
  fields: ExecutionInputField[];
}
