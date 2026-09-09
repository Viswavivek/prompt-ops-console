import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from '@/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/Login/LoginPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { WorkflowsPage } from '@/pages/Workflows/WorkflowsPage';
import { WorkflowDetailPage } from '@/pages/Workflows/WorkflowDetailPage';
import { PromptsPage } from '@/pages/Prompt/PromptsPage';
import { PromptPage } from '@/pages/Prompt/PromptPage';
import { PromptComparePage } from '@/pages/PromptCompare/PromptComparePage';
import { PlaceholderPage } from '@/components/common';
import { RouteError } from '@/components/common/RouteError';
import { paths } from './paths';

export const router = createBrowserRouter([
  {
    path: paths.login,
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteError />,
    children: [
      { path: paths.dashboard, element: <DashboardPage /> },
      { path: paths.workflows, element: <WorkflowsPage /> },
      { path: paths.workflow(), element: <WorkflowDetailPage /> },
      { path: paths.prompts, element: <PromptsPage /> },
      { path: paths.prompt(), element: <PromptPage /> },
      { path: paths.promptCompare(), element: <PromptComparePage /> },
      {
        path: paths.executions,
        element: (
          <PlaceholderPage
            title="Executions"
            note="Execution history and debugging ship in Phase 3 (Steps 19–21)."
          />
        ),
      },
      {
        path: paths.search,
        element: <PlaceholderPage title="Search" note="Global search ships in Phase 4 (Step 22)." />,
      },
    ],
  },
  { path: '*', element: <Navigate to={paths.dashboard} replace /> },
]);
