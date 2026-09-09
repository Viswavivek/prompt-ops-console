import type { Id } from './api';

export interface SearchMatch {
  field: string;
  snippet?: string;
}

export interface WorkflowSearchResult {
  kind: 'workflow';
  workflowId: Id;
  workflowName: string;
  active?: boolean;
  match?: SearchMatch;
}

export interface PromptSearchResult {
  kind: 'prompt';
  promptId: Id;
  promptName: string;
  version?: number;
  match?: SearchMatch;
}

export type SearchResult = WorkflowSearchResult | PromptSearchResult;

export interface SearchResponse {
  results: SearchResult[];
}

export interface SearchQuery {
  q: string;
  type?: 'all' | 'workflow' | 'prompt';
  limit?: number;
}
