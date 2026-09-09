import { api } from './http';
import { toQuery } from './params';
import type { SearchQuery, SearchResponse } from '@/types';

/** Endpoint 25 in docs/API_CONTRACTS.md. */
export const searchApi = {
  search: (query: SearchQuery) => api.get<SearchResponse>(`/search${toQuery({ ...query })}`),
};
