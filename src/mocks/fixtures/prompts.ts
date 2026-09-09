import type { PromptMaster, PromptVersion } from '@/types';

/** tbl_prompt_master rows. */
export const mockPromptMasters: PromptMaster[] = [
  {
    promptId: '7',
    promptName: 'invoice-extraction-system',
    createdAt: '2026-06-02T09:12:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-08-30T14:05:00Z',
    changedBy: 'demo@promptops.dev',
  },
  {
    promptId: '8',
    promptName: 'support-triage-classifier',
    createdAt: '2026-06-20T11:40:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-09-01T08:22:00Z',
    changedBy: 'viewer@promptops.dev',
  },
  {
    promptId: '9',
    promptName: 'weekly-digest-writer',
    createdAt: '2026-07-11T16:00:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-07-11T16:00:00Z',
    changedBy: null,
  },
  {
    promptId: '10',
    promptName: 'contract-clause-reviewer',
    createdAt: '2026-08-05T10:30:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-09-03T12:15:00Z',
    changedBy: 'demo@promptops.dev',
  },
];

/**
 * tbl_prompt_version rows. `promptComment` IS the prompt body (decision D2).
 * Stored newest-last here; APIs sort as needed.
 */
export const mockPromptVersions: PromptVersion[] = [
  // ---- prompt 7 ----
  {
    promptVersionId: '7001',
    promptId: '7',
    version: 1,
    promptComment:
      'You are an assistant that extracts invoice fields.\n\nReturn JSON with: invoiceNumber, date, total.',
    createdAt: '2026-06-02T09:12:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-06-02T09:12:00Z',
    changedBy: null,
  },
  {
    promptVersionId: '7002',
    promptId: '7',
    version: 2,
    promptComment:
      'You are an expert accounts-payable assistant that extracts structured data from invoices.\n\nReturn strict JSON with keys: invoiceNumber, issueDate, dueDate, currency, subtotal, tax, total, vendor.\nIf a field is missing, use null. Do not guess.',
    createdAt: '2026-07-15T13:20:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-07-15T13:20:00Z',
    changedBy: null,
  },
  {
    promptVersionId: '7003',
    promptId: '7',
    version: 3,
    promptComment:
      'You are an expert accounts-payable assistant that extracts structured data from invoices.\n\nReturn strict JSON with keys: invoiceNumber, issueDate, dueDate, currency, subtotal, tax, total, vendor, lineItems[].\nEach lineItem has: description, quantity, unitPrice, amount.\nIf a field is missing, use null. Never fabricate values.\n\nRespond with JSON only — no prose, no code fences.',
    createdAt: '2026-08-30T14:05:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-08-30T14:05:00Z',
    changedBy: null,
  },
  // ---- prompt 8 ----
  {
    promptVersionId: '8001',
    promptId: '8',
    version: 1,
    promptComment:
      'Classify the support ticket into one of: billing, bug, feature_request, how_to, other.\nReturn just the label.',
    createdAt: '2026-06-20T11:40:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-06-20T11:40:00Z',
    changedBy: null,
  },
  {
    promptVersionId: '8002',
    promptId: '8',
    version: 2,
    promptComment:
      'You are a support triage classifier.\n\nGiven {{ticket.subject}} and {{ticket.body}}, output JSON:\n{ "category": one of ["billing","bug","feature_request","how_to","other"], "priority": one of ["low","normal","high","urgent"], "needsHuman": boolean }\n\nBe conservative with "urgent".',
    createdAt: '2026-09-01T08:22:00Z',
    createdBy: 'viewer@promptops.dev',
    changedAt: '2026-09-01T08:22:00Z',
    changedBy: null,
  },
  // ---- prompt 9 ----
  {
    promptVersionId: '9001',
    promptId: '9',
    version: 1,
    promptComment:
      '# Weekly Digest Writer\n\nSummarize the provided activity items into a friendly weekly digest in Markdown.\n\n- Group by theme\n- Keep it under 300 words\n- End with a "What to watch next week" section',
    createdAt: '2026-07-11T16:00:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-07-11T16:00:00Z',
    changedBy: null,
  },
  // ---- prompt 10 ----
  {
    promptVersionId: '10001',
    promptId: '10',
    version: 1,
    promptComment:
      'Review the contract clause and flag risks. Return a bullet list.',
    createdAt: '2026-08-05T10:30:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-08-05T10:30:00Z',
    changedBy: null,
  },
  {
    promptVersionId: '10002',
    promptId: '10',
    version: 2,
    promptComment:
      'You are a contracts attorney reviewing a single clause.\n\nInput: {{clause.text}}\nJurisdiction: {{clause.jurisdiction}}\n\nProduce JSON:\n{\n  "riskLevel": "low" | "medium" | "high",\n  "issues": [{ "summary": string, "rationale": string, "suggestedEdit": string }],\n  "acceptableAsIs": boolean\n}\n\nCite the specific wording that creates each risk.',
    createdAt: '2026-09-03T12:15:00Z',
    createdBy: 'demo@promptops.dev',
    changedAt: '2026-09-03T12:15:00Z',
    changedBy: null,
  },
];
