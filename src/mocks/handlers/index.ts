import { authHandlers } from './auth';
import { workflowHandlers } from './workflows';
import { promptHandlers } from './prompts';
import { executionHandlers } from './executions';
import { searchHandlers } from './search';
import { tokenHandlers } from './tokenUsage';
import { syncHandlers } from './sync';

export const handlers = [
  ...authHandlers,
  ...workflowHandlers,
  ...promptHandlers,
  ...executionHandlers,
  ...searchHandlers,
  ...tokenHandlers,
  ...syncHandlers,
];
