import { api } from './http';
import { toQuery } from './params';
import type { Id, Paginated, PromptListItem, PromptListQuery, PromptDetail } from '@/types';

/** Endpoints 15, 16, 21 in docs/API_CONTRACTS.md. */
export const promptApi = {
  list: (query?: PromptListQuery) =>
    api.get<Paginated<PromptListItem>>(`/prompts${toQuery(query)}`),

  get: (promptId: Id) => api.get<PromptDetail>(`/prompts/${promptId}`),

  create: (body: { promptName: string; promptComment?: string }) =>
    api.post<PromptListItem>('/prompts', body),
};
