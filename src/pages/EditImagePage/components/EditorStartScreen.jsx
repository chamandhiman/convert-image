import { WelcomeScreen } from './WelcomeScreen/WelcomeScreen';
import { NewProjectModal } from './WelcomeScreen/NewProjectModal';

export const CANVAS_PRESETS = [
  { label: 'Instagram Post', w: 1080, h: 1080, sub: 'Square 1:1' },
  { label: 'Instagram Story', w: 1080, h: 1920, sub: 'Vertical 9:16' },
  { label: 'YouTube Thumbnail', w: 1280, h: 720, sub: 'Landscape 16:9' },
  { label: 'Facebook Cover', w: 1640, h: 664, sub: 'Banner 2.5:1' },
  { label: 'Custom Size', w: null, h: null, sub: 'Custom dimensions' },
];

export const COLOR_SWATCHES = [
  { label: 'White', color: '#FFFFFF' },
  { label: 'Soft Gray', color: '#F8FAFC' },
  { label: 'Lavender', color: '#F5F3FF' },
  { label: 'Dark Navy', color: '#1E293B' },
  { label: 'Pure Black', color: '#000000' },
];

/**
 * Reusable Canvas Setup Dialog Modal (NewProjectModal adapter)
 */
export function CanvasSetupModal({ isOpen, onClose, onCreateCanvas }) {
  return (
    <NewProjectModal
      isOpen={isOpen}
      onClose={onClose}
      onCreate={(config) => onCreateCanvas(config)}
    />
  );
}

/**
 * WelcomeScreen adapter for EditorStartScreen
 */
export function EditorStartScreen({
  onOpenFile,
  onOpenImage,
  onCreateBlankCanvas,
  onLoadFiles,
  onImportPsdResult,
  isDragOver,
}) {
  return (
    <WelcomeScreen
      onOpenFile={onOpenFile || onOpenImage}
      onOpenImage={onOpenFile || onOpenImage}
      onCreateBlankCanvas={onCreateBlankCanvas}
      onLoadFiles={onLoadFiles}
      onImportPsdResult={onImportPsdResult}
      isDragOver={isDragOver}
    />
  );
}

export default EditorStartScreen;
