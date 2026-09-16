import React from 'react';
import { ArrowUpRight, Calendar, ChevronRight, ClipboardList, Layers, Search, Sparkles, UserRound, UserRoundCheck, Users } from 'lucide-react';
import { db } from '../services/db';

export default function MobileDashboard({ cohorts, onSelectCohort, selectedCohortId, onSelectDashboardCohort, onNavigateToTab }) {
  const allStudents = db.getAllStudents();
  const selectedCohort = cohorts.find(cohort => cohort.id === selectedCohortId) || null;
  const dashboardStudents = selectedCohort
    ? allStudents.filter(student => student.cohort_id === selectedCohort.id)
    : allStudents;
  const totalStudentsCount = dashboardStudents.length;
  const openCohort = cohorts.find(c => c.registration_open);

  const getStudentCount = (cohortId) => {
    return db.getStudentsByCohort(cohortId).length;
  };

  const maleStudents = dashboardStudents.filter((student) => student.gender === 'Male').length;
  const femaleStudents = dashboardStudents.filter((student) => student.gender === 'Female').length;
  const latestCohort = cohorts[0];
  const chartCohorts = selectedCohort ? [selectedCohort] : cohorts.slice(0, 5);
  const largestCohortSize = Math.max(1, ...chartCohorts.map(cohort => getStudentCount(cohort.id)));

  return (
    <div className="mobile-dashboard">
      <section className="mobile-hero-card">
        <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
        <div className="hero-kicker"><Sparkles size={14} /> TODAY'S OVERVIEW</div>
        <h2>Keep every student<br />in the picture.</h2>
        <p>{selectedCohort ? `${selectedCohort.name} at a glance.` : 'Your cohort workspace is up to date and ready to use.'}</p>
        <div className="hero-footer"><span><Calendar size={15} /> {new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span><button onClick={() => onNavigateToTab?.('search')}>Find a student <ArrowUpRight size={16} /></button></div>
      </section>

      <label className="mobile-cohort-filter">
        <span>Dashboard view</span>
        <select value={selectedCohortId || ''} onChange={(event) => onSelectDashboardCohort?.(event.target.value || null)}>
          <option value="">All cohorts</option>
          {cohorts.map(cohort => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}
        </select>
      </label>

      <div className="mobile-stats-grid">
        <div className="mobile-stat-card stat-card-indigo">
          <div className="mobile-stat-value">{selectedCohort ? 1 : cohorts.length}</div>
          <div className="mobile-stat-label">
            <Layers size={16} />
            <span>{selectedCohort ? 'Cohort' : 'Cohorts'}</span>
          </div>
        </div>
        <div className="mobile-stat-card stat-card-sky">
          <div className="mobile-stat-value">{totalStudentsCount}</div>
          <div className="mobile-stat-label">
            <Users size={16} />
            <span>Students</span>
          </div>
        </div>
        <div className="mobile-stat-card stat-card-violet">
          <div className="mobile-stat-value">{maleStudents}</div>
          <div className="mobile-stat-label">
            <UserRound size={16} />
            <span>Male</span>
          </div>
        </div>
        <div className="mobile-stat-card stat-card-rose">
          <div className="mobile-stat-value">{femaleStudents}</div>
          <div className="mobile-stat-label">
            <UserRoundCheck size={16} />
            <span>Female</span>
          </div>
        </div>
      </div>

      <section className="mobile-chart-card" aria-labelledby="mobile-enrollment-title">
        <div className="mobile-chart-heading"><div><p className="eyebrow">LIVE DATA</p><h3 id="mobile-enrollment-title">Enrollment by cohort</h3></div><span>{totalStudentsCount} students</span></div>
        <div className="mobile-bar-chart">
          {chartCohorts.length === 0 ? <p>No cohort data available yet.</p> : chartCohorts.map(cohort => {
            const count = getStudentCount(cohort.id);
            return <div className="mobile-bar-row" key={cohort.id}><span>{cohort.name}</span><div><i style={{ width: `${(count / largestCohortSize) * 100}%` }} /></div><strong>{count}</strong></div>;
          })}
        </div>
      </section>

      {openCohort ? (
        <div className="intake-banner">
          <div className="intake-icon"><ClipboardList size={20} /></div><div><span>INTAKE IN PROGRESS</span><strong>{openCohort.name} is accepting registrations</strong></div><button onClick={() => onSelectCohort(openCohort.id)} aria-label="Open current intake"><ChevronRight size={19} /></button>
        </div>
      ) : (
        <div className="mobile-info-alert warning">
          <ClipboardList size={22} className="alert-icon" />
          <div className="alert-content">
            <div className="alert-title">Registration Closed</div>
            <div className="alert-desc">All registrations are currently closed.</div>
          </div>
        </div>
      )}

      <div className="mobile-section">
        <div className="section-heading"><div><p className="eyebrow">AT A GLANCE</p><h3>Recent cohorts</h3></div><button className="text-action" onClick={() => onNavigateToTab?.('cohorts')}>View all</button></div>
        <div className="mobile-cohort-list home-cohort-list">
          {cohorts.slice(0, 3).map((c, index) => {
            const count = getStudentCount(c.id);
            return (
              <button
                key={c.id}
                className="mobile-cohort-row-btn"
                onClick={() => onSelectCohort(c.id)}
              >
                <span className={`cohort-index cohort-index-${index % 4}`}>{String(index + 1).padStart(2, '0')}</span><div className="cohort-row-details">
                  <span className="cohort-row-name">{c.name}</span>
                  <span className="cohort-row-sub">Started {c.start_year}{c.id === latestCohort?.id ? ' · Latest' : ''}</span>
                </div>
                <div className="cohort-row-meta">
                  <span className="cohort-student-chip">{count}<Users size={14} /></span><ChevronRight size={18} className="cohort-row-arrow" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <button className="dashboard-action-card" onClick={() => onNavigateToTab?.('search')}><span className="dashboard-action-icon"><Search size={20} /></span><span><strong>Need someone quickly?</strong><small>Search the complete student directory</small></span><ChevronRight size={19} /></button>
    </div>
  );
}
