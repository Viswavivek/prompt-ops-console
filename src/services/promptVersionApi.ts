import { api } from './http';
import { toQuery } from './params';
import type {
  Id,
  PromptVersion,
  PromptVersionSummary,
  CreatePromptVersionRequest,
} from '@/types';

/** Endpoints 17-20, 22 in docs/API_CONTRACTS.md. */
export const promptVersionApi = {
  /** All versions, newest first. Pass `summary` to omit bodies for long histories. */
  list: (promptId: Id, opts?: { summary?: boolean }) =>
    api.get<PromptVersionSummary[]>(
      `/prompts/${promptId}/versions${toQuery(opts?.summary ? { fields: 'summary' } : undefined)}`,
    ),

  get: (promptId: Id, version: number) =>
    api.get<PromptVersion>(`/prompts/${promptId}/versions/${version}`),

  /** Save = create a new version. Backend assigns version = max + 1. */
  create: (promptId: Id, body: CreatePromptVersionRequest) =>
    api.post<PromptVersion>(`/prompts/${promptId}/versions`, body),

  /** Creates a NEW version cloning `version`'s body (docs/ASSUMPTIONS.md, API §20). */
  restore: (promptId: Id, version: number) =>
    api.post<PromptVersion>(`/prompts/${promptId}/versions/${version}/restore`),

  /** Optional server-side diff; the UI can also fetch both versions and diff locally. */
  compare: (promptId: Id, a: number, b: number) =>
    api.get<{ a: PromptVersion; b: PromptVersion }>(
      `/prompts/${promptId}/compare${toQuery({ a, b })}`,
    ),
};
