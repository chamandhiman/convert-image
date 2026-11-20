import { Sliders, RefreshCw, Wand2, Minimize2 } from 'lucide-react';
import { ROUTES } from '@/routes/paths';

/**
 * Single source of truth for the Image Convert product navigation items.
 * Rendered in both:
 * 1. Main Header (desktop and mobile)
 * 2. Hamburger Sidebar Overlay Drawer
 *
 * Exactly four canonical creative products:
 * 1. Edit Image
 * 2. Convert Image
 * 3. Remove Background
 * 4. Compress Image
 */
export const NAV_ITEMS = [
  {
    to: ROUTES.edit,
    label: 'Edit Image',
    icon: Sliders,
    isActive: (pathname) =>
      pathname === ROUTES.edit || pathname === ROUTES.editOld || pathname === '/edit',
  },
  {
    to: ROUTES.convert,
    label: 'Convert Image',
    icon: RefreshCw,
    isActive: (pathname) =>
      pathname === ROUTES.convert || pathname === ROUTES.convertOld || pathname === '/convert',
  },
  {
    to: ROUTES.removeBackground,
    label: 'Remove Background',
    icon: Wand2,
    isActive: (pathname) =>
      pathname === ROUTES.removeBackground || pathname === '/remove-background',
  },
  {
    to: ROUTES.compress,
    label: 'Compress Image',
    icon: Minimize2,
    isActive: (pathname) =>
      pathname === ROUTES.compress ||
      pathname === ROUTES.compressOld ||
      pathname === '/compress' ||
      pathname === '/compress-image',
  },
];

export default NAV_ITEMS;

