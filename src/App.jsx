import React, { useState, useEffect } from 'react';
import { ZoomProvider, useZoom } from './context/ZoomContext';
import AdminDashboard from './web/AdminDashboard';
import MobileAdminDashboard from './mobile/MobileAdminDashboard';
import StudentRegistration from './web/StudentRegistration';
import { ArrowRight, BookOpen, GraduationCap, LayoutDashboard, ShieldCheck, UserPlus, Users } from 'lucide-react';
import './App.css';

function MainAppContent() {
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'register' || params.get('register') === 'true') {
      return 'portal';
    }
    if (params.get('view') === 'admin') return 'admin';
    return 'landing';
  });
  
  const { zoomLevel, zoomIn, zoomOut } = useZoom();

  // Screen size detection hook
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isStandaloneRegistration = window.location.search.includes('view=register') || window.location.search.includes('register=true');

  if (isStandaloneRegistration && currentView === 'portal') {
    return (
      <div className="app-container" style={{ padding: 'var(--spacing-md)' }}>
        <StudentRegistration />
      </div>
    );
  }

  const showHeader = currentView !== 'portal';

  return (
    <div className={`app-container ${currentView === 'landing' ? 'landing-container' : ''}`}>
      {/* Persistent Accessibility Header */}
      {showHeader && <header className="main-header">
        <div className="header-logo-section">
          <GraduationCap className="header-logo-icon" size={32} />
          <h1 className="header-title-main">Cohort Management</h1>
        </div>

        <div className="header-actions">
          {/* Zoom options button group */}
          <div className="zoom-options-group">
            <span className="zoom-label">Text Size:</span>
            <button
              type="button"
              className="btn-zoom-opt"
              onClick={zoomOut}
              disabled={zoomLevel <= 50}
              title="Decrease text size (Ctrl+-)"
              aria-label="Zoom out"
            >−</button>
            <span className="zoom-level-display" aria-live="polite">
              {zoomLevel}%
            </span>
            <button
              type="button"
              className="btn-zoom-opt"
              onClick={zoomIn}
              disabled={zoomLevel >= 200}
              title="Increase text size (Ctrl+=)"
              aria-label="Zoom in"
            >+</button>
          </div>
        </div>
      </header>}

      {/* Render selected view */}
      {currentView === 'landing' ? (
        <LandingPage onAdmin={() => setCurrentView('admin')} />
      ) : currentView === 'admin' ? (
        isMobile ? <MobileAdminDashboard /> : <AdminDashboard />
      ) : (
        <div className="admin-content">
          <button 
            className="btn btn-secondary" 
            onClick={() => setCurrentView('admin')} 
            style={{ marginBottom: '15px', minHeight: '48px' }}
          >
            Back to Admin Dashboard
          </button>
          <StudentRegistration />
        </div>
      )}
    </div>
  );
}

function LandingPage({ onAdmin }) {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-kicker"><span className="landing-kicker-dot" /> COHORT OPERATIONS PLATFORM</div>
          <h1>Bring every cohort<br /><em>into focus.</em></h1>
          <p>A calm, connected workspace for managing student records, cohort enrollment, and the people who support them.</p>
          <div className="landing-actions">
            <button className="landing-primary-action" onClick={onAdmin}><LayoutDashboard size={19} /> Open admin workspace <ArrowRight size={17} /></button>
          </div>
          <div className="landing-trust"><ShieldCheck size={17} /> Structured records · Offline-ready · Built for clarity</div>
        </div>
        <div className="landing-hero-art" aria-hidden="true"><div className="landing-orbit landing-orbit-one" /><div className="landing-orbit landing-orbit-two" /><div className="landing-art-card landing-art-card-main"><div className="art-card-top"><span className="art-card-icon"><Users size={19} /></span><span><b>Active directory</b><small>All student records</small></span><span className="art-live-dot" /></div><div className="art-stat-row"><strong>248</strong><span>students across<br />7 cohorts</span></div><div className="art-bars"><i /><i /><i /><i /><i /><i /><i /></div></div><div className="landing-art-card landing-art-card-float"><BookOpen size={16} /><span><b>7</b><small>cohorts</small></span></div></div>
      </section>
      <section className="landing-feature-strip"><div><span className="landing-feature-icon purple"><LayoutDashboard size={20} /></span><span><b>One clear workspace</b><small>Cohorts and students at a glance</small></span></div><div><span className="landing-feature-icon green"><ShieldCheck size={20} /></span><span><b>Designed for trust</b><small>Accessible, structured, and resilient</small></span></div><div><span className="landing-feature-icon amber"><UserPlus size={20} /></span><span><b>Simple registration</b><small>A guided path for every new learner</small></span></div></section>
    </main>
  );
}

export default function App() {
  return (
    <ZoomProvider>
      <MainAppContent />
    </ZoomProvider>
  );
}
