import { createBrowserRouter, Navigate } from 'react-router-dom';

import AppLayout from '@/components/layout/AppLayout';
import RouteError from '@/components/layout/RouteError';
import HomePage from '@/pages/HomePage';
import EditImagePage from '@/pages/EditImagePage';
import CompressPage from '@/pages/CompressPage';
import ConvertPage from '@/pages/ConvertPage';
import ResizePage from '@/pages/ResizePage';
import CropPage from '@/pages/CropPage';
import RotatePage from '@/pages/RotatePage';
import { JpgToPngPage, PngToJpgPage, ImageToWebpPage } from '@/pages/ConversionPages';
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
import {
  PrivacyPolicyPage,
  TermsPage,
  CookiePolicyPage,
  ContactPage,
} from '@/pages/LegalPage';
import NotFoundPage from '@/pages/NotFoundPage';

import { ROUTES } from './paths';

/**
 * Application route tree.
 *
 * AppLayout is the shared shell: it renders once and every child route paints
 * into its <Outlet />. All tool URLs use descriptive, keyword-rich slugs.
 * Legacy URLs permanently redirect to their canonical equivalents.
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },

      // Canonical tool routes
      { path: ROUTES.edit, element: <EditImagePage /> },
      { path: ROUTES.convert, element: <ConvertPage /> },
      { path: ROUTES.resize, element: <ResizePage /> },
      { path: ROUTES.compress, element: <CompressPage /> },
      { path: ROUTES.crop, element: <CropPage /> },
      { path: ROUTES.rotate, element: <RotatePage /> },
      { path: ROUTES.jpgToPng, element: <JpgToPngPage /> },
      { path: ROUTES.pngToJpg, element: <PngToJpgPage /> },
      { path: ROUTES.imageToWebp, element: <ImageToWebpPage /> },
      { path: ROUTES.removeBackground, element: <RemoveBackgroundPage /> },
      { path: ROUTES.photoRestorer, element: <PhotoRestorerPage /> },
      { path: ROUTES.upscaler, element: <ImageUpscalerPage /> },
      { path: ROUTES.objectRemover, element: <ObjectRemoverPage /> },
      { path: ROUTES.imageExtender, element: <ImageExtenderPage /> },
      { path: ROUTES.generativeFill, element: <GenerativeFillPage /> },
      { path: ROUTES.optimize, element: <OptimizePage /> },
      { path: ROUTES.clean, element: <CleanPage /> },
      { path: ROUTES.analyze, element: <AnalyzePage /> },

      // Permanent 301-equivalent redirects from old/short URLs
      { path: ROUTES.editOld, element: <Navigate to={ROUTES.edit} replace /> },
      { path: ROUTES.convertOld, element: <Navigate to={ROUTES.convert} replace /> },
      { path: ROUTES.resizeOld, element: <Navigate to={ROUTES.resize} replace /> },
      { path: ROUTES.compressOld, element: <Navigate to={ROUTES.compress} replace /> },
      { path: ROUTES.cropOld, element: <Navigate to={ROUTES.crop} replace /> },
      { path: ROUTES.rotateOld, element: <Navigate to={ROUTES.rotate} replace /> },
      { path: ROUTES.optimizeOld, element: <Navigate to={ROUTES.optimize} replace /> },
      { path: ROUTES.cleanOld, element: <Navigate to={ROUTES.clean} replace /> },
      { path: ROUTES.analyzeOld, element: <Navigate to={ROUTES.analyze} replace /> },

      // Convenient navigation aliases
      { path: '/image-formats', element: <Navigate to={`${ROUTES.convert}#formats`} replace /> },
      { path: '/image-guidelines', element: <Navigate to={ROUTES.licenses} replace /> },
      { path: '/help', element: <Navigate to={ROUTES.contact} replace /> },
      { path: '/help-center', element: <Navigate to={ROUTES.contact} replace /> },

      // Informational & Legal routes
      { path: ROUTES.licenses, element: <LicensesPage /> },
      { path: ROUTES.privacy, element: <PrivacyPolicyPage /> },
      { path: ROUTES.terms, element: <TermsPage /> },
      { path: ROUTES.cookies, element: <CookiePolicyPage /> },
      { path: ROUTES.contact, element: <ContactPage /> },
      { path: ROUTES.notFound, element: <NotFoundPage /> },
    ],
  },
]);

export default router;
