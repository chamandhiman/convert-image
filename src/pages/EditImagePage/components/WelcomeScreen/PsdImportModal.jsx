import { useState, useRef, useEffect } from 'react';
import { parsePsdFile } from '../../utils/psdImporter';
import { FileImportLoadingModal } from '../FileImportLoadingModal/FileImportLoadingModal';

/**
 * Minimal PSD Import Loading Component
 * Matches minimal mockup: centered white card, single progress bar with percentage,
 * short status line, and single Cancel button. Closes automatically on completion.
 */
export function PsdImportModal({ isOpen, onClose, onImportPsd, initialFile = null }) {
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [progressStep, setProgressStep] = useState('Parsing layers...');
  const [progressPercent, setProgressPercent] = useState(67);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      cancelledRef.current = false;
      if (initialFile) {
        startParseFile(initialFile);
      }
    } else {
      setFile(null);
      setIsParsing(false);
    }
  }, [isOpen, initialFile]);

  const handleCancel = () => {
    cancelledRef.current = true;
    setIsParsing(false);
    onClose?.();
  };

  const startParseFile = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setProgressPercent(20);
    setProgressStep('Reading file...');

    try {
      const result = await parsePsdFile(selectedFile, {
        onProgress: (pct, msg) => {
          if (cancelledRef.current) return;
          setProgressPercent(pct);
          setProgressStep(msg || 'Parsing layers...');
        },
      });

      if (cancelledRef.current) return;

      if (onImportPsd) {
        onImportPsd(result);
      }
      onClose?.();
    } catch (err) {
      console.error('[PsdImportModal] Error parsing PSD:', err);
      setIsParsing(false);
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <FileImportLoadingModal
      isOpen={isOpen}
      fileName={file?.name || initialFile?.name || 'Photoshop Document.psd'}
      fileType="PSD"
      progress={progressPercent}
      status={progressStep}
      onCancel={handleCancel}
    />
  );
}

export default PsdImportModal;
