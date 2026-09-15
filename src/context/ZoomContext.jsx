import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { applyZoomIn, applyZoomOut, computeFontSize, initZoomLevel } from './zoomUtils.js';

const ZoomContext = createContext({
  zoomLevel: 100,
  setZoomLevel: () => {},
  zoomIn: () => {},
  zoomOut: () => {},
  resetZoom: () => {},
  isZoomed: false,
});

export const ZoomProvider = ({ children }) => {
  const [zoomLevel, setZoomLevelRaw] = useState(() =>
    initZoomLevel(localStorage.getItem('ims_zoom_level'))
  );

  const setZoomLevel = useCallback((level) => {
    setZoomLevelRaw(Math.min(200, Math.max(50, Math.round(level))));
  }, []);

  const zoomIn = useCallback(() => {
    setZoomLevelRaw((prev) => applyZoomIn(prev));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevelRaw((prev) => applyZoomOut(prev));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevelRaw(100);
  }, []);

  // Apply CSS variable, toggle class, and persist to localStorage
  useEffect(() => {
    const px = computeFontSize(zoomLevel);
    document.documentElement.style.setProperty('--font-size-base', `${px}px`);
    document.documentElement.classList.toggle('zoom-enabled', zoomLevel !== 100);
    localStorage.setItem('ims_zoom_level', String(zoomLevel));
    // Legacy backward-compat key
    localStorage.setItem('ims_text_zoomed', String(zoomLevel !== 100));
  }, [zoomLevel]);

  // Keyboard shortcuts: Ctrl+= / Ctrl++ → zoomIn, Ctrl+- → zoomOut, Ctrl+0 → resetZoom
  useEffect(() => {
    const handler = (e) => {
      if (!e.ctrlKey) return;
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomIn, zoomOut, resetZoom]);

  const isZoomed = zoomLevel !== 100;

  return (
    <ZoomContext.Provider value={{ zoomLevel, setZoomLevel, zoomIn, zoomOut, resetZoom, isZoomed }}>
      {children}
    </ZoomContext.Provider>
  );
};

export const useZoom = () => useContext(ZoomContext);
