import { createBrowserRouter } from 'react-router-dom';

import AppLayout from '@/components/layout/AppLayout';
import RouteError from '@/components/layout/RouteError';
import HomePage from '@/pages/HomePage';
import CompressPage from '@/pages/CompressPage';
import ConvertPage from '@/pages/ConvertPage';
import ResizePage from '@/pages/ResizePage';
import OptimizePage from '@/pages/OptimizePage';
import CleanPage from '@/pages/CleanPage';
import AnalyzePage from '@/pages/AnalyzePage';
import RemoveBackgroundPage from '@/pages/RemoveBackgroundPage';
import ImageUpscalerPage from '@/pages/ImageUpscalerPage';
import ObjectRemoverPage from '@/pages/ObjectRemoverPage';
import ImageExtenderPage from '@/pages/ImageExtenderPage';
import PhotoRestorerPage from '@/pages/PhotoRestorerPage';
import GenerativeFillPage from '@/pages/GenerativeFillPage';
import LicensesPage from '@/pages/LicensesPage';
import NotFoundPage from '@/pages/NotFoundPage';

import { ROUTES } from './paths';

/**
 * Application route tree.
 *
 * AppLayout is the shared shell: it renders once and every child route paints
 * into its <Outlet />. Add new top-level pages to `children` and register their
 * path in ./paths.js.
 *
 * Pages are imported eagerly while the tree is small. Once feature pages carry
 * real weight, swap an entry for the data router's `lazy` option to code-split
 * it:
 *   { path: ROUTES.convert, lazy: () => import('@/pages/ConvertPage/route') }
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.compress, element: <CompressPage /> },
      { path: ROUTES.convert, element: <ConvertPage /> },
      { path: ROUTES.resize, element: <ResizePage /> },
      { path: ROUTES.optimize, element: <OptimizePage /> },
      { path: ROUTES.clean, element: <CleanPage /> },
      { path: ROUTES.analyze, element: <AnalyzePage /> },
      { path: ROUTES.removeBackground, element: <RemoveBackgroundPage /> },
      { path: ROUTES.objectRemover, element: <ObjectRemoverPage /> },
      { path: ROUTES.upscaler, element: <ImageUpscalerPage /> },
      { path: ROUTES.imageExtender, element: <ImageExtenderPage /> },
      { path: ROUTES.photoRestorer, element: <PhotoRestorerPage /> },
      { path: ROUTES.generativeFill, element: <GenerativeFillPage /> },
      { path: ROUTES.licenses, element: <LicensesPage /> },
      { path: ROUTES.notFound, element: <NotFoundPage /> },
    ],
  },
]);

export default router;
