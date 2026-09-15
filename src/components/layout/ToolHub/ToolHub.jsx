import { Suspense, lazy } from 'react';

import { Link, useLocation } from 'react-router-dom';

import { ROUTES } from '@/routes/paths';

import {
  IconDownload,
  IconCrop,
  IconCompress,
  IconMagic,
  IconSparkles,
  IconMaximize,
} from '@/components/ui/Icons/Icons';

import styles from './ToolHub.module.css';

const MAIN_TOOLS = [
  { key: 'convert', label: 'Convert', to: ROUTES.convert, icon: IconDownload },
  { key: 'compress', label: 'Compress', to: ROUTES.compress, icon: IconCompress },
  { key: 'resize', label: 'Resize', to: ROUTES.resize, icon: IconCrop },
  { key: 'removeBackground', label: 'Background Remover', to: ROUTES.removeBackground, icon: IconMagic },
  { key: 'objectRemover', label: 'Object Remover', to: ROUTES.objectRemover, icon: IconSparkles },
  { key: 'upscaler', label: 'Image Upscaler', to: ROUTES.upscaler, icon: IconMaximize },
  { key: 'generativeFill', label: 'AI Generative Fill', to: ROUTES.generativeFill, icon: IconSparkles },
];

const TOOL_COMPONENTS = {
  convert: lazy(() => import('@/pages/ConvertPage/ConvertPage').then((m) => ({ default: m.default }))),
  compress: lazy(() => import('@/pages/CompressPage/CompressPage').then((m) => ({ default: m.default }))),
  resize: lazy(() => import('@/pages/ResizePage/ResizePage').then((m) => ({ default: m.default }))),
  removeBackground: lazy(() => import('@/pages/RemoveBackgroundPage/RemoveBackgroundPage').then((m) => ({ default: m.default }))),
  objectRemover: lazy(() => import('@/pages/ObjectRemoverPage/ObjectRemoverPage').then((m) => ({ default: m.default }))),
  upscaler: lazy(() => import('@/pages/ImageUpscalerPage/ImageUpscalerPage').then((m) => ({ default: m.default }))),
  generativeFill: lazy(() => import('@/pages/GenerativeFillPage/GenerativeFillPage').then((m) => ({ default: m.default }))),
};

function ToolHub() {
  const location = useLocation();
  const activeToolKey = MAIN_TOOLS.find((tool) => location.pathname === tool.to)?.key || MAIN_TOOLS[0].key;
  const ActiveComponent = TOOL_COMPONENTS[activeToolKey];

  return (
    <div className={styles.root}>
      <div className={`container mt-2 ${styles.inner}`}>
        <div className={`${styles.toolBar}`} role="tablist" aria-label="Tools">
          {MAIN_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeToolKey === tool.key;
            return (
              <Link
                key={tool.key}
                to={tool.to}
                role="tab"
                aria-selected={isActive}
                className={`${styles.toolTab} ${isActive ? styles.toolTabActive : ''}`}
              >
                <Icon size={16} />
                {tool.label}
              </Link>
            );
          })}
        </div>

        <div className={styles.workspace}>
          <Suspense fallback={<div className={styles.placeholder}>Loading tool...</div>}>
            {ActiveComponent && <ActiveComponent embedded />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default ToolHub;
