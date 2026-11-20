import { useState, useRef } from 'react';
import {
  Plus,
  FolderOpen,
  Image as ImageIcon,
  UploadCloud,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { isExternalFileDrag, extractFilesFromEvent } from '@/utils/dragDropHelpers';
import { NewProjectModal } from './NewProjectModal';
import styles from './WelcomeScreen.module.css';

// SVG Icons for Presets
function InstagramIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ig-grad" cx="20%" cy="100%" r="130%">
          <stop offset="0%" stopColor="#ffda77" />
          <stop offset="20%" stopColor="#f88344" />
          <stop offset="60%" stopColor="#e1306c" />
          <stop offset="100%" stopColor="#833ab4" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#ig-grad)" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.2" stroke="url(#ig-grad)" strokeWidth="2.2" />
      <circle cx="17.5" cy="6.5" r="1.3" fill="url(#ig-grad)" />
    </svg>
  );
}

function YouTubeIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="4.5" fill="#EF4444" />
      <polygon points="10,8.5 16,12 10,15.5" fill="#FFFFFF" />
    </svg>
  );
}

function FacebookIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#2563EB" />
      <path
        d="M13.5 8H15V5.5H13C10.8 5.5 10 6.8 10 9V11H8V13.5H10V19H13V13.5H15.2L15.6 11H13V9.2C13.01 8.5 13.2 8 13.5 8Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function WelcomeScreen({
  onCreateBlankCanvas,
  onOpenFile,
  onOpenImage,
  onLoadFiles,
  onImportPsdResult,
  isDragOver: externalDragOver = false,
}) {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [customPresetConfig, setCustomPresetConfig] = useState(null);
  const [localDragOver, setLocalDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Popular Presets definitions
  const POPULAR_PRESETS = [
    {
      id: 'ig-post',
      name: 'Instagram Post',
      dims: '1080 × 1080',
      width: 1080,
      height: 1080,
      icon: <InstagramIcon size={16} />,
    },
    {
      id: 'ig-story',
      name: 'Instagram Story',
      dims: '1080 × 1920',
      width: 1080,
      height: 1920,
      icon: <Smartphone size={16} color="#8b5cf6" />,
    },
    {
      id: 'yt-thumb',
      name: 'YouTube Thumbnail',
      dims: '1280 × 720',
      width: 1280,
      height: 720,
      icon: <YouTubeIcon size={18} />,
    },
    {
      id: 'fb-cover',
      name: 'Facebook Cover',
      dims: '1640 × 664',
      width: 1640,
      height: 664,
      icon: <FacebookIcon size={16} />,
    },
    {
      id: 'custom-size',
      name: 'Custom Size',
      dims: 'W × H',
      width: null,
      height: null,
      icon: <Monitor size={16} color="#7c3aed" />,
    },
  ];

  // Handle Preset Click
  const handlePresetClick = (preset) => {
    if (preset.width && preset.height) {
      onCreateBlankCanvas({
        name: `${preset.name.replace(/\s+/g, '-')}.png`,
        width: preset.width,
        height: preset.height,
        bgColor: '#FFFFFF',
        isTransparent: false,
      });
    } else {
      setCustomPresetConfig({ label: 'Custom Canvas' });
      setIsNewProjectOpen(true);
    }
  };

  // Drag and drop handlers on the drop area
  const handleDragOverArea = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!localDragOver) setLocalDragOver(true);
  };

  const handleDragLeaveArea = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalDragOver(false);
  };

  const handleDropFiles = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalDragOver(false);

    const files = extractFilesFromEvent(e);
    if (files && files.length > 0) {
      onLoadFiles?.(files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onLoadFiles?.(files);
      e.target.value = '';
    }
  };

  return (
    <div
      className={styles.welcomeScreenWrapper}
      data-testid="editor-welcome-screen"
      onDragOver={(e) => {
        if (isExternalFileDrag(e)) {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={(e) => {
        if (isExternalFileDrag(e)) {
          e.preventDefault();
          e.stopPropagation();
          setLocalDragOver(false);
          const files = extractFilesFromEvent(e);
          if (files && files.length > 0) {
            onLoadFiles?.(files);
          }
        }
      }}
    >
      <div className={styles.welcomeContent}>
        {/* TOP: 2 Compact Action Cards */}
        <div className={styles.compactActionCardsRow} data-testid="welcome-action-cards">
          {/* Card 1: New Project */}
          <div
            className={styles.compactActionCard}
            onClick={() => {
              setCustomPresetConfig(null);
              setIsNewProjectOpen(true);
            }}
            data-testid="welcome-card-new-project"
            id="start-blank-canvas-btn"
          >
            <div className={styles.compactActionIconBox}>
              <Plus size={18} strokeWidth={2.5} />
            </div>
            <div className={styles.compactActionTextBox}>
              <h3 className={styles.compactActionTitle}>New Project</h3>
              <p className={styles.compactActionDesc}>Create a blank canvas</p>
            </div>
          </div>

          {/* Card 2: Open File (Universal Image & PSD) */}
          <div
            className={styles.compactActionCard}
            onClick={() => {
              if (onOpenFile) onOpenFile();
              else if (onOpenImage) onOpenImage();
              else if (fileInputRef.current) fileInputRef.current.click();
            }}
            data-testid="welcome-card-open-file"
            id="start-open-file-btn"
          >
            <div className={styles.compactActionIconBox}>
              <FolderOpen size={18} strokeWidth={2.2} />
            </div>
            <div className={styles.compactActionTextBox}>
              <h3 className={styles.compactActionTitle}>Open File</h3>
              <p className={styles.compactActionDesc}>Open image or PSD project</p>
            </div>
          </div>
        </div>

        {/* CENTER: Main Upload Area (Primary Visual Focus) */}
        <div
          className={`${styles.mainUploadBox} ${localDragOver || externalDragOver ? styles.mainUploadBoxActive : ''}`}
          onDragOver={handleDragOverArea}
          onDragLeave={handleDragLeaveArea}
          onDrop={handleDropFiles}
          onClick={() => {
            if (onOpenFile) onOpenFile();
            else if (fileInputRef.current) fileInputRef.current.click();
            else if (onOpenImage) onOpenImage();
          }}
          data-testid="welcome-upload-dropzone"
          data-drag-drop-area="true"
          id="welcome-upload-dropzone"
        >
          <div className={styles.uploadIconCircle}>
            <UploadCloud size={38} className={styles.uploadCloudIcon} />
          </div>
          <h2 className={styles.uploadHeading}>Drop your files here</h2>
          <p className={styles.uploadSubtext}>
            or <span className={styles.browseLink}>browse files</span> from your computer
          </p>
          <p className={styles.supportedFormatsText}>
            Supports PSD, JPG, PNG, WEBP, GIF, BMP, SVG and AVIF.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            className={styles.hiddenInput}
            accept=".psd,image/vnd.adobe.photoshop,image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml,image/avif,image/x-icon,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,.ico"
            multiple
            onChange={handleFileInputChange}
            data-testid="welcome-file-input"
          />
        </div>

        {/* BOTTOM: Small, Compact Social Media Presets */}
        <div className={styles.presetsSection}>
          <div className={styles.presetsHeaderRow}>
            <span className={styles.presetsSectionLabel}>Popular Canvas Sizes</span>
          </div>

          <div className={styles.presetMiniCardsRow} data-testid="popular-presets-row">
            {POPULAR_PRESETS.map((p) => (
              <div
                key={p.id}
                className={styles.presetMiniCard}
                onClick={() => handlePresetClick(p)}
                data-testid={`preset-card-${p.id}`}
                title={`${p.name} (${p.dims})`}
              >
                <div className={styles.presetMiniIcon}>{p.icon}</div>
                <div className={styles.presetMiniText}>
                  <span className={styles.presetMiniName}>{p.name}</span>
                  <span className={styles.presetMiniDims}>{p.dims}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dialog Modals */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        initialPreset={customPresetConfig}
        onClose={() => {
          setIsNewProjectOpen(false);
          setCustomPresetConfig(null);
        }}
        onCreate={(config) => {
          onCreateBlankCanvas(config);
          setIsNewProjectOpen(false);
          setCustomPresetConfig(null);
        }}
      />
    </div>
  );
}

export default WelcomeScreen;
