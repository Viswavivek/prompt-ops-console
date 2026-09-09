export const paths = {
  login: '/login',
  dashboard: '/',
  workflows: '/workflows',
  workflow: (id = ':workflowId') => `/workflows/${id}`,
  prompts: '/prompts',
  prompt: (id = ':promptId') => `/prompts/${id}`,
  promptCompare: (id = ':promptId') => `/prompts/${id}/compare`,
  executions: '/executions',
  execution: (id = ':executionId') => `/executions/${id}`,
  search: '/search',
} as const;
