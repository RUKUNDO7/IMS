import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import MobileDashboard from './MobileDashboard';
import MobileRoster from './MobileRoster';
import MobileSearch from './MobileSearch';
import MobileSettings from './MobileSettings';
import { Bell, Home, Search, Settings, Users, Wifi, WifiOff } from 'lucide-react';

export default function MobileAdminDashboard() {
  const [cohorts, setCohorts] = useState([]);
  const [mobileTab, setMobileTab] = useState('dashboard');
  const [mobileActiveCohortId, setMobileActiveCohortId] = useState(null);
  const [mobileDashboardCohortId, setMobileDashboardCohortId] = useState(null);

  // Network connection and simulation states
  const [isNetworkOffline, setIsNetworkOffline] = useState(!navigator.onLine);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);
  const [notice, setNotice] = useState('');
  const isAppOffline = isNetworkOffline || isSimulatingOffline;
  const totalStudents = db.getAllStudents().length;

  useEffect(() => {
    const handleOnline = () => setIsNetworkOffline(false);
    const handleOffline = () => setIsNetworkOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Offline timestamp
  const [offlineTime, setOfflineTime] = useState('');
  useEffect(() => {
    if (isAppOffline) {
      const now = new Date();
      setOfflineTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [isAppOffline]);

  const refreshData = () => setCohorts(db.getCohorts());

  useEffect(() => {
    refreshData();
  }, []);

  const handleSelectCohortMobile = (cohortId) => {
    setMobileActiveCohortId(cohortId);
    setMobileTab('cohorts');
  };

  const selectTab = (tab) => {
    setMobileTab(tab);
    if (tab !== 'cohorts') setMobileActiveCohortId(null);
  };

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleResetDatabase = () => {
    if (!window.confirm('Reset saved student data on this device?')) return;
    ['ims_cohorts', 'ims_students', 'ims_guardians'].forEach((key) => localStorage.removeItem(key));
    refreshData();
    setNotice('Sample data has been restored.');
  };

  let mobileContent;
  if (mobileTab === 'dashboard') {
    mobileContent = (
      <MobileDashboard
        cohorts={cohorts}
        onSelectCohort={handleSelectCohortMobile}
        selectedCohortId={mobileDashboardCohortId}
        onSelectDashboardCohort={setMobileDashboardCohortId}
        onNavigateToTab={selectTab}
      />
    );
  } else if (mobileTab === 'cohorts') {
    if (mobileActiveCohortId) {
      mobileContent = (
        <MobileRoster
          cohortId={mobileActiveCohortId}
          onBack={() => setMobileActiveCohortId(null)}
          isOffline={isAppOffline}
          offlineTime={offlineTime}
        />
      );
    } else {
      mobileContent = (
        <section className="mobile-view-padding cohort-browser">
          <div className="page-heading-row">
            <div><p className="eyebrow">Directory</p><h2>All cohorts</h2><p>Choose a class to view its student list.</p></div>
            <span className="heading-count">{cohorts.length}</span>
          </div>
          <div className="mobile-cohort-list">
            {cohorts.map((c, index) => {
              const count = db.getStudentsByCohort(c.id).length;
              return (
                <button
                  key={c.id}
                  className="mobile-cohort-row-btn rich-cohort-row"
                  onClick={() => setMobileActiveCohortId(c.id)}
                >
                  <span className={`cohort-index cohort-index-${index % 4}`}>{String(index + 1).padStart(2, '0')}</span>
                  <div className="cohort-row-details">
                    <span className="cohort-row-name">{c.name}</span>
                    <span className="cohort-row-sub">Class of {c.start_year} · {c.registration_open ? 'Registration open' : 'Archived'}</span>
                  </div>
                  <span className="cohort-student-chip">{count}<Users size={14} /></span>
                </button>
              );
            })}
          </div>
        </section>
      );
    }
  } else if (mobileTab === 'search') {
    mobileContent = (
      <MobileSearch cohorts={cohorts} />
    );
  } else {
    mobileContent = <MobileSettings isSimulatingOffline={isSimulatingOffline} onToggleSimulateOffline={() => setIsSimulatingOffline((value) => !value)} isNetworkOffline={isNetworkOffline} onResetDatabase={handleResetDatabase} onSeedDatabase={handleResetDatabase} />;
  }

  return (
    <div className="mobile-layout mobile-app-shell">
      <div className="mobile-app-bar">
        <button className="brand-mark" aria-label="Go to dashboard" onClick={() => selectTab('dashboard')}>CM</button>
        <div className="mobile-app-title"><span>COHORT CENTRAL</span><strong>{mobileTab === 'dashboard' ? 'Good to see you' : mobileTab === 'cohorts' ? 'Student directory' : mobileTab === 'search' ? 'Find a student' : 'Your workspace'}</strong></div>
        <div className="app-bar-actions"><span className={`connection-dot ${isAppOffline ? 'offline' : ''}`} title={isAppOffline ? 'Offline' : 'Online'}>{isAppOffline ? <WifiOff size={15} /> : <Wifi size={15} />}</span><button className="app-icon-btn" aria-label="Notifications" onClick={() => setNotice(`${totalStudents} students are saved on this device.`)}><Bell size={20} /></button></div>
      </div>
      {notice && <div className="mobile-toast" role="status">{notice}</div>}
      <main className="mobile-main-content">{mobileContent}</main>
      <nav className="mobile-bottom-tab-bar" aria-label="Main navigation">
        <button
          className={`mobile-tab-btn ${mobileTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => selectTab('dashboard')}
        >
          <Home size={22} />
          <span>Home</span>
        </button>
        
        <button
          className={`mobile-tab-btn ${mobileTab === 'cohorts' ? 'active' : ''}`}
          onClick={() => selectTab('cohorts')}
        >
          <Users size={22} />
          <span>Cohorts</span>
        </button>
        
        <button className={`mobile-tab-btn mobile-tab-fab ${mobileTab === 'search' ? 'active' : ''}`} onClick={() => selectTab('search')} aria-label="Search students"><span><Search size={23} /></span><small>Search</small></button>
        <button className={`mobile-tab-btn ${mobileTab === 'settings' ? 'active' : ''}`} onClick={() => selectTab('settings')}><Settings size={22} /><span>More</span></button>
      </nav>
    </div>
  );
}
