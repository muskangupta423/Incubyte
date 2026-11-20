import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppProviders } from './AppProviders';
import { createQueryClient } from './query-client';
import { appRoutes } from './routes';

const router = createBrowserRouter(appRoutes);
const queryClient = createQueryClient();

export function App() {
  return (
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
