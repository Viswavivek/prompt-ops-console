import type { WorkflowListItem, WorkflowTask } from '@/types';

/** tbl_prompt_workflowmapping_master — workflowId -> promptId (no enforced FK, B2). */
export const mockMappings: { promptWorkflowId: string; workflowId: string; promptId: string; createdAt: string; createdBy: string }[] = [
  { promptWorkflowId: '301', workflowId: '1001', promptId: '7', createdAt: '2026-06-03T09:00:00Z', createdBy: 'demo@promptops.dev' },
  { promptWorkflowId: '302', workflowId: '1002', promptId: '8', createdAt: '2026-06-21T09:00:00Z', createdBy: 'demo@promptops.dev' },
  { promptWorkflowId: '303', workflowId: '1003', promptId: '9', createdAt: '2026-07-12T09:00:00Z', createdBy: 'demo@promptops.dev' },
  { promptWorkflowId: '304', workflowId: '1005', promptId: '10', createdAt: '2026-08-06T09:00:00Z', createdBy: 'demo@promptops.dev' },
];

/** tbl_workflow_master rows enriched with n8n live fields. */
export const mockWorkflows: WorkflowListItem[] = [
  {
    workflowId: '1001',
    workflowName: 'Invoice Ingestion & Extraction',
    n8nWorkflowId: 'n8n_inv_001',
    active: true,
    updatedAt: '2026-09-04T18:20:00Z',
    createdAt: '2026-06-01T09:00:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-09-04T18:20:00Z',
    changedBy: 'demo@promptops.dev',
    mappedPrompt: { promptId: '7', promptName: 'invoice-extraction-system', currentVersion: 3 },
    tags: ['finance', 'ocr'],
  },
  {
    workflowId: '1002',
    workflowName: 'Support Ticket Triage',
    n8nWorkflowId: 'n8n_sup_002',
    active: true,
    updatedAt: '2026-09-05T10:02:00Z',
    createdAt: '2026-06-19T09:00:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-09-05T10:02:00Z',
    changedBy: 'viewer@promptops.dev',
    mappedPrompt: { promptId: '8', promptName: 'support-triage-classifier', currentVersion: 2 },
    tags: ['support'],
  },
  {
    workflowId: '1003',
    workflowName: 'Weekly Digest Generator',
    n8nWorkflowId: 'n8n_dig_003',
    active: false,
    updatedAt: '2026-08-01T07:00:00Z',
    createdAt: '2026-07-10T09:00:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-08-01T07:00:00Z',
    changedBy: 'demo@promptops.dev',
    mappedPrompt: { promptId: '9', promptName: 'weekly-digest-writer', currentVersion: 1 },
    tags: ['reporting'],
  },
  {
    workflowId: '1004',
    workflowName: 'Lead Enrichment Pipeline',
    n8nWorkflowId: 'n8n_lead_004',
    active: true,
    updatedAt: '2026-09-02T12:30:00Z',
    createdAt: '2026-07-22T09:00:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-09-02T12:30:00Z',
    changedBy: 'demo@promptops.dev',
    mappedPrompt: null,
    tags: ['sales'],
  },
  {
    workflowId: '1005',
    workflowName: 'Contract Clause Reviewer',
    n8nWorkflowId: 'n8n_law_005',
    active: true,
    updatedAt: '2026-09-05T16:45:00Z',
    createdAt: '2026-08-04T09:00:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-09-05T16:45:00Z',
    changedBy: 'demo@promptops.dev',
    mappedPrompt: { promptId: '10', promptName: 'contract-clause-reviewer', currentVersion: 2 },
    tags: ['legal'],
  },
  {
    workflowId: '1006',
    workflowName: 'Nightly Data Backup',
    n8nWorkflowId: 'n8n_ops_006',
    active: false,
    updatedAt: '2026-05-15T02:00:00Z',
    createdAt: '2026-05-10T09:00:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-05-15T02:00:00Z',
    changedBy: null,
    mappedPrompt: null,
    tags: ['ops'],
  },
];

/** tbl_workflow_task rows keyed by workflowId. */
export const mockWorkflowTasks: Record<string, WorkflowTask[]> = {
  '1001': [
    task('5001', '1001', 'Receive Invoice Webhook', 'Webhook'),
    task('5002', '1001', 'OCR Document', 'HTTP Request'),
    task('5003', '1001', 'Extract Fields (LLM)', 'OpenAI'),
    task('5004', '1001', 'Persist to Ledger', 'Postgres'),
  ],
  '1002': [
    task('5010', '1002', 'Poll Tickets', 'Schedule Trigger'),
    task('5011', '1002', 'Classify (LLM)', 'OpenAI'),
    task('5012', '1002', 'Route to Queue', 'Switch'),
  ],
  '1003': [
    task('5020', '1003', 'Collect Activity', 'HTTP Request'),
    task('5021', '1003', 'Write Digest (LLM)', 'OpenAI'),
    task('5022', '1003', 'Send Email', 'Send Email'),
  ],
  '1004': [
    task('5030', '1004', 'New Lead Trigger', 'Webhook'),
    task('5031', '1004', 'Enrich via Clearbit', 'HTTP Request'),
  ],
  '1005': [
    task('5040', '1005', 'Upload Clause', 'Webhook'),
    task('5041', '1005', 'Review (LLM)', 'OpenAI'),
    task('5042', '1005', 'Store Findings', 'Postgres'),
  ],
  '1006': [task('5050', '1006', 'Dump Database', 'Execute Command')],
};

function task(
  taskId: string,
  workflowId: string,
  taskName: string,
  nodeName: string,
): WorkflowTask {
  return {
    taskId,
    taskName,
    nodeName,
    workflowId,
    createdAt: '2026-06-01T09:00:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-06-01T09:00:00Z',
    changedBy: null,
  };
}
