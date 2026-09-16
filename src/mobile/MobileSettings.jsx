import React from 'react';
import { useZoom } from '../context/ZoomContext';
import { Wifi, WifiOff, Database, RotateCcw, Settings } from 'lucide-react';

export default function MobileSettings({
  isSimulatingOffline,
  onToggleSimulateOffline,
  isNetworkOffline,
  onResetDatabase,
  onSeedDatabase
}) {
  const { zoomLevel, setZoomLevel } = useZoom();
  const actualOffline = isNetworkOffline || isSimulatingOffline;

  return (
    <div className="mobile-settings-view">
      <div className="mobile-welcome-banner settings-banner">
        <h2 className="mobile-welcome-title mobile-welcome-title-with-icon">
          <Settings size={26} aria-hidden="true" />
          <span>Settings &amp; Accessibility</span>
        </h2>
        <p className="mobile-welcome-subtitle">Change text size, connection, and saved data</p>
      </div>

      <div className="mobile-settings-container">
        {/* Accessibility Section */}
        <div className="mobile-settings-section">
          <h3 className="settings-section-title">Accessibility</h3>
          <div className="settings-card">
            <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--spacing-sm)' }}>
              <div className="settings-info-text">
                <span className="settings-label">Text Zoom Sizing</span>
                <span className="settings-description">Adjust system font sizing for easier reading.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
                <button
                  type="button"
                  className={`btn-settings-action toggle-btn ${zoomLevel === 100 ? 'active' : ''}`}
                  onClick={() => setZoomLevel(100)}
                  style={{ minHeight: '56px', flex: 1, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  100%
                </button>
                <button
                  type="button"
                  className={`btn-settings-action toggle-btn ${zoomLevel === 122 ? 'active' : ''}`}
                  onClick={() => setZoomLevel(122)}
                  style={{ minHeight: '56px', flex: 1, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  122%
                </button>
                <button
                  type="button"
                  className={`btn-settings-action toggle-btn ${zoomLevel === 144 ? 'active' : ''}`}
                  onClick={() => setZoomLevel(144)}
                  style={{ minHeight: '56px', flex: 1, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  144%
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connectivity Section */}
        <div className="mobile-settings-section">
          <h3 className="settings-section-title">Connectivity</h3>
          <div className="settings-card">
            <div className="settings-row border-b pb-4 mb-4">
              <div className="settings-info-text">
                <span className="settings-label">Network Status</span>
                <span className="settings-description">Real-time device network connection status.</span>
              </div>
              <div className={`network-badge ${isNetworkOffline ? 'offline' : 'online'}`}>
                {isNetworkOffline ? <WifiOff size={18} /> : <Wifi size={18} />}
                <span>{isNetworkOffline ? 'Offline' : 'Online'}</span>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-info-text">
                <span className="settings-label">Simulate Offline Mode</span>
                <span className="settings-description">Simulate offline mode to test student lists and saving data.</span>
              </div>
              <button
                type="button"
                className={`btn-settings-action toggle-btn ${isSimulatingOffline ? 'offline-active' : ''}`}
                onClick={onToggleSimulateOffline}
                style={{ minHeight: '56px', minWidth: '130px' }}
              >
                {isSimulatingOffline ? <WifiOff size={20} /> : <Wifi size={20} />}
                <span>{isSimulatingOffline ? 'Simulating' : 'Normal'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Saved Data Section */}
        <div className="mobile-settings-section">
          <h3 className="settings-section-title">Manage Data</h3>
          <div className="settings-card">
              <p className="db-management-intro">
                Load sample student and class data on this device. You cannot save changes while offline.
              </p>
              
              <div className="settings-action-buttons">
                <button
                  className="btn-db-action primary"
                  onClick={onSeedDatabase}
                  disabled={actualOffline}
                  style={{ minHeight: '56px' }}
                >
                  <Database size={20} />
                  <span>Load Sample Data</span>
                </button>
                <button
                  className="btn-db-action secondary"
                  onClick={onResetDatabase}
                  disabled={actualOffline}
                  style={{ minHeight: '52px' }}
                >
                  <RotateCcw size={18} />
                  <span>Restore starter data</span>
                </button>
              
              {actualOffline && (
                <div className="settings-action-warning">
                  ⚠️ Internet connection required to perform writes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
