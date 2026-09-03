import { RouterProvider } from 'react-router-dom';

import { router } from '@/routes';

/**
 * Root component.
 *
 * Kept intentionally thin: it mounts the router and is the place to wrap global
 * providers (theme, query client, toasts) as they are introduced.
 */
function App() {
  return <RouterProvider router={router} />;
}

export default App;
