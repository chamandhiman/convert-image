import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import styles from './BlendingOptionsModal.module.css';

const BLEND_MODES = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
];

const SECTIONS = [
  { id: 'general', label: 'Blending Options' },
  { id: 'dropShadow', label: 'Drop Shadow', hasCheck: true },
  { id: 'innerShadow', label: 'Inner Shadow', hasCheck: true },
  { id: 'outerGlow', label: 'Outer Glow', hasCheck: true },
  { id: 'innerGlow', label: 'Inner Glow', hasCheck: true },
  { id: 'stroke', label: 'Stroke', hasCheck: true },
  { id: 'colorOverlay', label: 'Color Overlay', hasCheck: true },
  { id: 'gradientOverlay', label: 'Gradient Overlay', hasCheck: true },
  { id: 'bevelEmboss', label: 'Bevel and Emboss', hasCheck: true },
];

export function BlendingOptionsModal({
  isOpen,
  layer,
  onClose,
  onApply,
  onLiveChange,
}) {
  const [activeSection, setActiveSection] = useState('general');

  // Working state copy
  const [stylesState, setStylesState] = useState(() => ({
    blendMode: layer?.blendMode || 'normal',
    opacity: layer?.opacity ?? 100,
    fillOpacity: layer?.fillOpacity ?? 100,
    dropShadow: {
      enabled: Boolean(layer?.styles?.dropShadow?.enabled),
      color: layer?.styles?.dropShadow?.color || '#000000',
      opacity: layer?.styles?.dropShadow?.opacity ?? 60,
      angle: layer?.styles?.dropShadow?.angle ?? 90,
      distance: layer?.styles?.dropShadow?.distance ?? 10,
      blur: layer?.styles?.dropShadow?.blur ?? 12,
    },
    innerShadow: {
      enabled: Boolean(layer?.styles?.innerShadow?.enabled),
      color: layer?.styles?.innerShadow?.color || '#000000',
      opacity: layer?.styles?.innerShadow?.opacity ?? 50,
      distance: layer?.styles?.innerShadow?.distance ?? 5,
      blur: layer?.styles?.innerShadow?.blur ?? 8,
    },
    outerGlow: {
      enabled: Boolean(layer?.styles?.outerGlow?.enabled),
      color: layer?.styles?.outerGlow?.color || '#ffd700',
      opacity: layer?.styles?.outerGlow?.opacity ?? 75,
      blur: layer?.styles?.outerGlow?.blur ?? 15,
    },
    innerGlow: {
      enabled: Boolean(layer?.styles?.innerGlow?.enabled),
      color: layer?.styles?.innerGlow?.color || '#ffffff',
      opacity: layer?.styles?.innerGlow?.opacity ?? 60,
      blur: layer?.styles?.innerGlow?.blur ?? 10,
    },
    stroke: {
      enabled: Boolean(layer?.styles?.stroke?.enabled),
      size: layer?.styles?.stroke?.size ?? 3,
      position: layer?.styles?.stroke?.position || 'outside',
      color: layer?.styles?.stroke?.color || '#000000',
      opacity: layer?.styles?.stroke?.opacity ?? 100,
    },
    colorOverlay: {
      enabled: Boolean(layer?.styles?.colorOverlay?.enabled),
      color: layer?.styles?.colorOverlay?.color || '#7c3aed',
      blendMode: layer?.styles?.colorOverlay?.blendMode || 'normal',
      opacity: layer?.styles?.colorOverlay?.opacity ?? 80,
    },
    gradientOverlay: {
      enabled: Boolean(layer?.styles?.gradientOverlay?.enabled),
      color1: layer?.styles?.gradientOverlay?.color1 || '#7c3aed',
      color2: layer?.styles?.gradientOverlay?.color2 || '#ec4899',
      angle: layer?.styles?.gradientOverlay?.angle ?? 90,
      opacity: layer?.styles?.gradientOverlay?.opacity ?? 85,
    },
    bevelEmboss: {
      enabled: Boolean(layer?.styles?.bevelEmboss?.enabled),
      style: layer?.styles?.bevelEmboss?.style || 'inner-bevel',
      size: layer?.styles?.bevelEmboss?.size ?? 5,
      depth: layer?.styles?.bevelEmboss?.depth ?? 100,
    },
  }));

  // Update working state when layer changes
  useEffect(() => {
    if (layer) {
      setStylesState({
        blendMode: layer.blendMode || 'normal',
        opacity: layer.opacity ?? 100,
        fillOpacity: layer.fillOpacity ?? 100,
        dropShadow: {
          enabled: Boolean(layer.styles?.dropShadow?.enabled),
          color: layer.styles?.dropShadow?.color || '#000000',
          opacity: layer.styles?.dropShadow?.opacity ?? 60,
          angle: layer.styles?.dropShadow?.angle ?? 90,
          distance: layer.styles?.dropShadow?.distance ?? 10,
          blur: layer.styles?.dropShadow?.blur ?? 12,
        },
        innerShadow: {
          enabled: Boolean(layer.styles?.innerShadow?.enabled),
          color: layer.styles?.innerShadow?.color || '#000000',
          opacity: layer.styles?.innerShadow?.opacity ?? 50,
          distance: layer.styles?.innerShadow?.distance ?? 5,
          blur: layer.styles?.innerShadow?.blur ?? 8,
        },
        outerGlow: {
          enabled: Boolean(layer.styles?.outerGlow?.enabled),
          color: layer.styles?.outerGlow?.color || '#ffd700',
          opacity: layer.styles?.outerGlow?.opacity ?? 75,
          blur: layer.styles?.outerGlow?.blur ?? 15,
        },
        innerGlow: {
          enabled: Boolean(layer.styles?.innerGlow?.enabled),
          color: layer.styles?.innerGlow?.color || '#ffffff',
          opacity: layer.styles?.innerGlow?.opacity ?? 60,
          blur: layer.styles?.innerGlow?.blur ?? 10,
        },
        stroke: {
          enabled: Boolean(layer.styles?.stroke?.enabled),
          size: layer.styles?.stroke?.size ?? 3,
          position: layer.styles?.stroke?.position || 'outside',
          color: layer.styles?.stroke?.color || '#000000',
          opacity: layer.styles?.stroke?.opacity ?? 100,
        },
        colorOverlay: {
          enabled: Boolean(layer.styles?.colorOverlay?.enabled),
          color: layer.styles?.colorOverlay?.color || '#7c3aed',
          blendMode: layer.styles?.colorOverlay?.blendMode || 'normal',
          opacity: layer.styles?.colorOverlay?.opacity ?? 80,
        },
        gradientOverlay: {
          enabled: Boolean(layer.styles?.gradientOverlay?.enabled),
          color1: layer.styles?.gradientOverlay?.color1 || '#7c3aed',
          color2: layer.styles?.gradientOverlay?.color2 || '#ec4899',
          angle: layer.styles?.gradientOverlay?.angle ?? 90,
          opacity: layer.styles?.gradientOverlay?.opacity ?? 85,
        },
        bevelEmboss: {
          enabled: Boolean(layer.styles?.bevelEmboss?.enabled),
          style: layer.styles?.bevelEmboss?.style || 'inner-bevel',
          size: layer.styles?.bevelEmboss?.size ?? 5,
          depth: layer.styles?.bevelEmboss?.depth ?? 100,
        },
      });
    }
  }, [layer]);

  // Support Enter to Apply, Escape to Cancel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        const tag = document.activeElement?.tagName;
        if (tag === 'TEXTAREA') return;
        e.preventDefault();
        onApply(stylesState);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, stylesState, onApply, onClose]);

  if (!isOpen || !layer) return null;

  const updateState = (updater) => {
    setStylesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      onLiveChange?.(next);
      return next;
    });
  };

  const toggleEffect = (effectKey, e) => {
    e?.stopPropagation();
    updateState((prev) => ({
      ...prev,
      [effectKey]: {
        ...prev[effectKey],
        enabled: !prev[effectKey]?.enabled,
      },
    }));
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose} data-testid="blending-options-modal">
      <div className={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Layer Style — {layer.name || 'Layer'}</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            {SECTIONS.map((sec) => {
              const isEffect = sec.hasCheck;
              const isChecked = isEffect ? Boolean(stylesState[sec.id]?.enabled) : false;
              const isActive = activeSection === sec.id;

              return (
                <div
                  key={sec.id}
                  className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
                  onClick={() => setActiveSection(sec.id)}
                >
                  {isEffect && (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => toggleEffect(sec.id, e)}
                      className={styles.effectCheckbox}
                    />
                  )}
                  <span>{sec.label}</span>
                </div>
              );
            })}
          </div>

          {/* Main Settings Panel */}
          <div className={styles.mainSettings}>
            {/* General Blending */}
            {activeSection === 'general' && (
              <>
                <h4 className={styles.sectionHeading}>General Blending</h4>
                <div className={styles.formGrid}>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Blend Mode</label>
                    <select
                      value={stylesState.blendMode}
                      onChange={(e) => updateState({ blendMode: e.target.value })}
                      className={styles.selectInput}
                    >
                      {BLEND_MODES.map((bm) => (
                        <option key={bm.value} value={bm.value}>
                          {bm.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stylesState.opacity}
                      onChange={(e) => updateState({ opacity: Number(e.target.value) })}
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.opacity}%</span>
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Fill Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stylesState.fillOpacity}
                      onChange={(e) => updateState({ fillOpacity: Number(e.target.value) })}
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.fillOpacity}%</span>
                  </div>
                </div>
              </>
            )}

            {/* Drop Shadow */}
            {activeSection === 'dropShadow' && (
              <>
                <h4 className={styles.sectionHeading}>Drop Shadow Structure</h4>
                <div className={styles.formGrid}>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Shadow Color</label>
                    <div className={styles.colorInputWrap}>
                      <input
                        type="color"
                        value={stylesState.dropShadow.color}
                        onChange={(e) =>
                          updateState((p) => ({
                            ...p,
                            dropShadow: { ...p.dropShadow, color: e.target.value },
                          }))
                        }
                        className={styles.colorPicker}
                      />
                      <span>{stylesState.dropShadow.color.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stylesState.dropShadow.opacity}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          dropShadow: { ...p.dropShadow, opacity: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.dropShadow.opacity}%</span>
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Distance</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stylesState.dropShadow.distance}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          dropShadow: { ...p.dropShadow, distance: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.dropShadow.distance}px</span>
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Size / Blur</label>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={stylesState.dropShadow.blur}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          dropShadow: { ...p.dropShadow, blur: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.dropShadow.blur}px</span>
                  </div>
                </div>
              </>
            )}

            {/* Inner Shadow */}
            {activeSection === 'innerShadow' && (
              <>
                <h4 className={styles.sectionHeading}>Inner Shadow Structure</h4>
                <div className={styles.formGrid}>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Color</label>
                    <input
                      type="color"
                      value={stylesState.innerShadow.color}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          innerShadow: { ...p.innerShadow, color: e.target.value },
                        }))
                      }
                      className={styles.colorPicker}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stylesState.innerShadow.opacity}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          innerShadow: { ...p.innerShadow, opacity: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.innerShadow.opacity}%</span>
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Blur</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={stylesState.innerShadow.blur}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          innerShadow: { ...p.innerShadow, blur: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.innerShadow.blur}px</span>
                  </div>
                </div>
              </>
            )}

            {/* Outer Glow */}
            {activeSection === 'outerGlow' && (
              <>
                <h4 className={styles.sectionHeading}>Outer Glow Structure</h4>
                <div className={styles.formGrid}>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Glow Color</label>
                    <input
                      type="color"
                      value={stylesState.outerGlow.color}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          outerGlow: { ...p.outerGlow, color: e.target.value },
                        }))
                      }
                      className={styles.colorPicker}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stylesState.outerGlow.opacity}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          outerGlow: { ...p.outerGlow, opacity: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.outerGlow.opacity}%</span>
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Size</label>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={stylesState.outerGlow.blur}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          outerGlow: { ...p.outerGlow, blur: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.outerGlow.blur}px</span>
                  </div>
                </div>
              </>
            )}

            {/* Inner Glow */}
            {activeSection === 'innerGlow' && (
              <>
                <h4 className={styles.sectionHeading}>Inner Glow Structure</h4>
                <div className={styles.formGrid}>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Color</label>
                    <input
                      type="color"
                      value={stylesState.innerGlow.color}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          innerGlow: { ...p.innerGlow, color: e.target.value },
                        }))
                      }
                      className={styles.colorPicker}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stylesState.innerGlow.opacity}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          innerGlow: { ...p.innerGlow, opacity: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.innerGlow.opacity}%</span>
                  </div>
                </div>
              </>
            )}

            {/* Stroke */}
            {activeSection === 'stroke' && (
              <>
                <h4 className={styles.sectionHeading}>Stroke Structure</h4>
                <div className={styles.formGrid}>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Size</label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={stylesState.stroke.size}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          stroke: { ...p.stroke, size: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.stroke.size}px</span>
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Position</label>
                    <select
                      value={stylesState.stroke.position}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          stroke: { ...p.stroke, position: e.target.value },
                        }))
                      }
                      className={styles.selectInput}
                    >
                      <option value="outside">Outside</option>
                      <option value="inside">Inside</option>
                      <option value="center">Center</option>
                    </select>
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Color</label>
                    <input
                      type="color"
                      value={stylesState.stroke.color}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          stroke: { ...p.stroke, color: e.target.value },
                        }))
                      }
                      className={styles.colorPicker}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Color Overlay */}
            {activeSection === 'colorOverlay' && (
              <>
                <h4 className={styles.sectionHeading}>Color Overlay</h4>
                <div className={styles.formGrid}>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Overlay Color</label>
                    <input
                      type="color"
                      value={stylesState.colorOverlay.color}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          colorOverlay: { ...p.colorOverlay, color: e.target.value },
                        }))
                      }
                      className={styles.colorPicker}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stylesState.colorOverlay.opacity}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          colorOverlay: { ...p.colorOverlay, opacity: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.colorOverlay.opacity}%</span>
                  </div>
                </div>
              </>
            )}

            {/* Gradient Overlay */}
            {activeSection === 'gradientOverlay' && (
              <>
                <h4 className={styles.sectionHeading}>Gradient Overlay</h4>
                <div className={styles.formGrid}>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Gradient Start</label>
                    <input
                      type="color"
                      value={stylesState.gradientOverlay.color1}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          gradientOverlay: { ...p.gradientOverlay, color1: e.target.value },
                        }))
                      }
                      className={styles.colorPicker}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Gradient End</label>
                    <input
                      type="color"
                      value={stylesState.gradientOverlay.color2}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          gradientOverlay: { ...p.gradientOverlay, color2: e.target.value },
                        }))
                      }
                      className={styles.colorPicker}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Angle</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={stylesState.gradientOverlay.angle}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          gradientOverlay: { ...p.gradientOverlay, angle: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.gradientOverlay.angle}°</span>
                  </div>
                </div>
              </>
            )}

            {/* Bevel and Emboss */}
            {activeSection === 'bevelEmboss' && (
              <>
                <h4 className={styles.sectionHeading}>Bevel and Emboss Structure</h4>
                <div className={styles.formGrid}>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Style</label>
                    <select
                      value={stylesState.bevelEmboss.style}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          bevelEmboss: { ...p.bevelEmboss, style: e.target.value },
                        }))
                      }
                      className={styles.selectInput}
                    >
                      <option value="inner-bevel">Inner Bevel</option>
                      <option value="outer-bevel">Outer Bevel</option>
                      <option value="emboss">Emboss</option>
                    </select>
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Size</label>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={stylesState.bevelEmboss.size}
                      onChange={(e) =>
                        updateState((p) => ({
                          ...p,
                          bevelEmboss: { ...p.bevelEmboss, size: Number(e.target.value) },
                        }))
                      }
                      className={styles.sliderInput}
                    />
                    <span className={styles.valueBadge}>{stylesState.bevelEmboss.size}px</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div />
          <div className={styles.footerActions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnApply}
              onClick={() => onApply(stylesState)}
              data-testid="blending-apply-btn"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlendingOptionsModal;

