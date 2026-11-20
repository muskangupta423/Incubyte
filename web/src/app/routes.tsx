import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router';
import { EmployeesPage } from '../features/employees/EmployeesPage';
import { AppErrorPage } from './AppErrorPage';
import { AppLayout } from './layout/AppLayout';
import { NotFoundPage } from './NotFoundPage';

// Loaded only when the user opens Insights, so the charts library (added later)
// doesn't slow down the Employees page.
const InsightsPage = lazy(() =>
  import('../features/dashboard/InsightsPage').then((module) => ({ default: module.InsightsPage })),
);

export const appRoutes: RouteObject[] = [
  {
    element: <AppLayout />,
    errorElement: <AppErrorPage />,
    children: [
      { index: true, element: <Navigate to="/employees" replace /> },
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'insights', element: <InsightsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
