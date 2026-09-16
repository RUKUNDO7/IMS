import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import CohortDetails from './CohortDetails';
import { Users, Plus, CheckCircle, Search, BookOpen, ShieldAlert, Pencil, Trash2, X, Menu, ChevronDown, ChevronUp, Layers, UserRound, UserRoundCheck } from 'lucide-react';

const MIN_DATE_OF_BIRTH = '2000-01-01';

const getTodayDateString = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'cohorts' | 'all-students'
  const [cohorts, setCohorts] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [activeCohortId, setActiveCohortId] = useState(null);

  // Network connection and simulation states
  const [isNetworkOffline, setIsNetworkOffline] = useState(!navigator.onLine);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);
  const isAppOffline = isNetworkOffline || isSimulatingOffline;

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

  // Cohort creation form state
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortYear, setNewCohortYear] = useState(new Date().getFullYear().toString());
  
  // Search state for all students view
  const [studentSearch, setStudentSearch] = useState('');
  const [showSecondaryGuardians, setShowSecondaryGuardians] = useState(false);
  const [banner, setBanner] = useState(null); // { type: 'success'|'error', message: '' }
  const [editingStudent, setEditingStudent] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isCohortMenuOpen, setIsCohortMenuOpen] = useState(false);
  const [selectedDashboardCohortId, setSelectedDashboardCohortId] = useState(null);

  const refreshData = () => {
    setCohorts(db.getCohorts());
    setAllStudents(db.getAllStudents());
  };

  useEffect(() => {
    refreshData();
  }, [activeCohortId]);

  const handleCreateCohort = (e) => {
    e.preventDefault();
    if (isAppOffline) return;
    setBanner(null);

    if (!newCohortName.trim()) {
      setBanner({ type: 'error', message: 'Cohort Name is required.' });
      return;
    }
    if (!newCohortYear.trim()) {
      setBanner({ type: 'error', message: 'Start Year is required.' });
      return;
    }

    try {
      db.createCohort({
        name: newCohortName,
        start_year: parseInt(newCohortYear, 10)
      });

      setNewCohortName('');
      setNewCohortYear(new Date().getFullYear().toString());
      setBanner({ type: 'success', message: `Cohort "${newCohortName}" was successfully created.` });
      refreshData();
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Error creating cohort.' });
    }
  };

  const handleOpenStudentEditor = (student) => {
    setEditingStudent({
      ...student,
      guardians: student.guardians.map(guardian => ({ ...guardian })),
    });
  };

  const handleStudentEditChange = (event) => {
    const { name, value } = event.target;
    setEditingStudent(current => ({ ...current, [name]: value }));
  };

  const handleGuardianEditChange = (index, field, value) => {
    setEditingStudent(current => ({
      ...current,
      guardians: current.guardians.map((guardian, guardianIndex) => (
        guardianIndex === index ? { ...guardian, [field]: value } : guardian
      )),
    }));
  };

  const handleSaveStudent = (event) => {
    event.preventDefault();
    if (isAppOffline || !editingStudent) return;

    try {
      db.updateStudent(editingStudent.id, editingStudent, editingStudent.guardians);
      setBanner({ type: 'success', message: `${editingStudent.first_name} ${editingStudent.last_name} was updated.` });
      setEditingStudent(null);
      refreshData();
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Unable to update student.' });
    }
  };

  const handleDeleteStudent = (student) => {
    if (isAppOffline) return;
    const studentName = `${student.first_name} ${student.last_name}`;
    if (!window.confirm(`Delete ${studentName}? This will also remove their guardian details.`)) return;

    try {
      db.deleteStudent(student.id);
      setBanner({ type: 'success', message: `${studentName} was deleted.` });
      refreshData();
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Unable to delete student.' });
    }
  };

  // Get total student count for each cohort
  const getCohortStudentCount = (cohortId) => {
    const list = db.getStudentsByCohort(cohortId);
    return list.length;
  };

  const selectedDashboardCohort = cohorts.find(cohort => cohort.id === selectedDashboardCohortId) || null;
  const dashboardStudents = selectedDashboardCohort
    ? allStudents.filter(student => student.cohort_id === selectedDashboardCohort.id)
    : allStudents;
  const dashboardStats = {
    cohorts: selectedDashboardCohort ? 1 : cohorts.length,
    students: dashboardStudents.length,
    male: dashboardStudents.filter(student => student.gender?.toLowerCase() === 'male').length,
    female: dashboardStudents.filter(student => student.gender?.toLowerCase() === 'female').length,
  };
  const chartCohorts = selectedDashboardCohort ? [selectedDashboardCohort] : cohorts;
  const largestCohortSize = Math.max(1, ...chartCohorts.map(cohort => (
    allStudents.filter(student => student.cohort_id === cohort.id).length
  )));
  const malePercentage = dashboardStats.students
    ? Math.round((dashboardStats.male / dashboardStats.students) * 100)
    : 0;

  const selectDashboardCohort = (cohortId) => {
    setSelectedDashboardCohortId(cohortId);
    setActiveTab('dashboard');
    setIsCohortMenuOpen(false);
    setBanner(null);
  };

  // Filter global student list
  const filteredAllStudents = allStudents.filter(student => {
    const query = studentSearch.toLowerCase();
    const matchesName = `${student.first_name} ${student.last_name}`.toLowerCase().includes(query);
    const matchesAddress = student.address.toLowerCase().includes(query);
    
    // Find cohort name
    const cohortObj = cohorts.find(c => c.id === student.cohort_id);
    const matchesCohort = cohortObj ? cohortObj.name.toLowerCase().includes(query) : false;
    
    const matchesGuardians = student.guardians.some(g =>
      g.full_name.toLowerCase().includes(query) ||
      g.phone_number.includes(query)
    );

    return matchesName || matchesAddress || matchesCohort || matchesGuardians;
  }).sort((a, b) => {
    const lastCompare = a.last_name.localeCompare(b.last_name);
    if (lastCompare !== 0) return lastCompare;
    return a.first_name.localeCompare(b.first_name);
  });

  // If viewing cohort details, render the subview
  if (activeCohortId) {
    return (
      <div className="admin-content">
        <CohortDetails
          cohortId={activeCohortId}
          onBack={() => setActiveCohortId(null)}
          isOffline={isAppOffline}
        />
      </div>
    );
  }

  return (
      <div className={`dashboard-container ${focusMode ? 'dashboard-focus-mode' : ''}`}>
      {/* Sidebar navigation */}
      <aside className="admin-sidebar">
        <button
          type="button"
          className="sidebar-menu-button"
          onClick={() => setFocusMode(true)}
          aria-label="Hide sidebar menu"
        >
          <Menu size={24} />
          <span>Menu</span>
        </button>

        <button
          type="button"
          className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setIsCohortMenuOpen(value => !value); setActiveTab('dashboard'); setBanner(null); }}
          aria-expanded={isCohortMenuOpen}
        >
          <BookOpen size={24} />
          <span>Cohort List</span>
          {isCohortMenuOpen ? <ChevronUp className="sidebar-chevron" size={20} /> : <ChevronDown className="sidebar-chevron" size={20} />}
        </button>

        {isCohortMenuOpen && (
          <div className="cohort-dropdown" aria-label="Choose a cohort">
            <button
              type="button"
              className={`cohort-dropdown-item ${!selectedDashboardCohortId ? 'selected' : ''}`}
              onClick={() => selectDashboardCohort(null)}
            >
              All cohorts
            </button>
            {cohorts.map(cohort => (
              <button
                type="button"
                key={cohort.id}
                className={`cohort-dropdown-item ${selectedDashboardCohortId === cohort.id ? 'selected' : ''}`}
                onClick={() => selectDashboardCohort(cohort.id)}
              >
                {cohort.name}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          className={`sidebar-btn ${activeTab === 'all-students' ? 'active' : ''}`}
          onClick={() => { setActiveTab('all-students'); setIsCohortMenuOpen(false); setBanner(null); }}
        >
          <Users size={24} />
          <span>Student List</span>
        </button>
      </aside>

      {/* Main content display */}
      <main className="admin-content">
        {focusMode && <button type="button" className="dashboard-menu-trigger" onClick={() => setFocusMode(false)} aria-label="Show sidebar menu" title="Show menu">
          <Menu size={22} />
          <span>Menu</span>
        </button>}
        {isAppOffline && (
          <div className="banner banner-error" style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={28} />
            <span><strong>Offline Mode</strong> - You cannot make changes when offline. Creating a cohort is disabled.</span>
          </div>
        )}

        {banner && (
          <div className={`banner banner-${banner.type}`}>
            <CheckCircle size={28} />
            <span>{banner.message}</span>
          </div>
        )}

        {activeTab === 'dashboard' ? (
          <section className="dashboard-overview" aria-labelledby="dashboard-title">
            <div className="dashboard-heading">
              <div>
                <p className="dashboard-eyebrow">OVERVIEW</p>
                <h2 id="dashboard-title">Dashboard</h2>
                <p>{selectedDashboardCohort ? `${selectedDashboardCohort.name} at a glance` : 'All cohorts at a glance'}</p>
              </div>
              {selectedDashboardCohort && (
                <button type="button" className="dashboard-clear-filter" onClick={() => selectDashboardCohort(null)}>
                  View all cohorts
                </button>
              )}
            </div>

            <div className="dashboard-stats-grid">
              <article className="dashboard-stat-card stat-card-cohorts">
                <span className="dashboard-stat-icon"><Layers size={25} /></span>
                <div><span className="dashboard-stat-label">{selectedDashboardCohort ? 'Selected cohort' : 'Available cohorts'}</span><strong>{dashboardStats.cohorts}</strong></div>
              </article>
              <article className="dashboard-stat-card stat-card-students">
                <span className="dashboard-stat-icon"><Users size={25} /></span>
                <div><span className="dashboard-stat-label">Total students</span><strong>{dashboardStats.students}</strong></div>
              </article>
              <article className="dashboard-stat-card stat-card-male">
                <span className="dashboard-stat-icon"><UserRound size={25} /></span>
                <div><span className="dashboard-stat-label">Male students</span><strong>{dashboardStats.male}</strong></div>
              </article>
              <article className="dashboard-stat-card stat-card-female">
                <span className="dashboard-stat-icon"><UserRoundCheck size={25} /></span>
                <div><span className="dashboard-stat-label">Female students</span><strong>{dashboardStats.female}</strong></div>
              </article>
            </div>

            <div className="dashboard-charts-grid">
              <article className="dashboard-chart-card">
                <div className="dashboard-chart-heading">
                  <div><h3>Enrollment by cohort</h3><p>{selectedDashboardCohort ? 'Students in the selected cohort' : 'Students registered in each cohort'}</p></div>
                </div>
                <div className="cohort-bar-chart" role="img" aria-label="Student enrollment by cohort">
                  {chartCohorts.length === 0 ? (
                    <p className="chart-empty-state">No cohort data available yet.</p>
                  ) : chartCohorts.map(cohort => {
                    const count = allStudents.filter(student => student.cohort_id === cohort.id).length;
                    return (
                      <div className="cohort-bar-row" key={cohort.id}>
                        <span className="cohort-bar-label" title={cohort.name}>{cohort.name}</span>
                        <div className="cohort-bar-track"><span className="cohort-bar-fill" style={{ width: `${(count / largestCohortSize) * 100}%` }} /></div>
                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="dashboard-chart-card gender-chart-card">
                <div className="dashboard-chart-heading"><div><h3>Gender distribution</h3><p>{selectedDashboardCohort ? selectedDashboardCohort.name : 'Across all cohorts'}</p></div></div>
                <div className="gender-chart-content">
                  <div className="gender-donut" style={{ background: `conic-gradient(#4c3ab7 0 ${malePercentage}%, #d61a6e ${malePercentage}% 100%)` }}><span>{dashboardStats.students}</span><small>students</small></div>
                  <div className="gender-chart-legend"><span><i className="gender-legend-male" />Male <strong>{dashboardStats.male}</strong></span><span><i className="gender-legend-female" />Female <strong>{dashboardStats.female}</strong></span></div>
                </div>
              </article>
            </div>
          </section>
        ) : activeTab === 'cohorts' ? (
          <div>
            {/* Create New Cohort Section */}
            <div className="card">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={24} style={{ color: 'var(--color-primary)' }} /> Create a New Cohort
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Add a new cohort to start saving student records or open public registration.
              </p>

              <form onSubmit={handleCreateCohort} style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flexGrow: 1, minWidth: '240px' }}>
                  <label htmlFor="new-cohort-name" className="form-label">Cohort Name</label>
                  <input
                    type="text"
                    id="new-cohort-name"
                    className="input-text"
                    style={{ minHeight: '52px' }}
                    value={newCohortName}
                    onChange={(e) => setNewCohortName(e.target.value)}
                    placeholder="e.g. Cohort 8"
                    required
                    disabled={isAppOffline}
                  />
                </div>

                <div className="form-group" style={{ width: '150px' }}>
                  <label htmlFor="new-cohort-year" className="form-label">Start Year</label>
                  <input
                    type="number"
                    id="new-cohort-year"
                    className="input-text"
                    style={{ minHeight: '52px' }}
                    value={newCohortYear}
                    onChange={(e) => setNewCohortYear(e.target.value)}
                    min="2000"
                    max="2100"
                    required
                    disabled={isAppOffline}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ minHeight: '52px' }} disabled={isAppOffline}>
                  <Plus size={20} /> Add Cohort
                </button>
              </form>
            </div>

            {/* List Cohorts */}
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Active Cohorts</h2>
            <div className="cohort-grid">
              {cohorts.map(c => {
                const studentCount = getCohortStudentCount(c.id);
                return (
                  <div
                    key={c.id}
                    className="cohort-card"
                    onClick={() => setActiveCohortId(c.id)}
                  >
                    <div>
                      <h3 className="cohort-card-title">{c.name}</h3>
                      <div className="cohort-card-year">Start Year: {c.start_year}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                        👥 {studentCount} Registered Students
                      </div>
                    </div>
                    <span className={`cohort-card-status ${c.registration_open ? 'open' : 'closed'}`}>
                      {c.registration_open ? '● Registration Open' : '● Registration Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Global Roster view */
          <div>
            <div className="card">
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={24} style={{ color: 'var(--color-primary)' }} /> All Students
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Search and filter student records across all cohorts. Useful for quick phone lookup or address verify.
              </p>

              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search students, addresses, parents, or cohort name..."
                  className="input-text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ minHeight: '48px', paddingLeft: '40px' }}
                />
                <Search
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)'
                  }}
                />
              </div>

              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={showSecondaryGuardians}
                    onChange={(e) => setShowSecondaryGuardians(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Show Secondary Parent/Guardian Details
                </label>
              </div>
            </div>

            <div className="gender-section" style={{ overflowX: 'auto' }}>
              {filteredAllStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                  No student records match search filter.
                </div>
              ) : (
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Cohort</th>
                      <th>Gender</th>
                      <th>Date of Birth</th>
                       <th>Primary Guardian Phone</th>
                       {showSecondaryGuardians && <th>Secondary Guardian Phone</th>}
                       <th>Address</th>
                       <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllStudents.map(student => {
                      const cohortObj = cohorts.find(c => c.id === student.cohort_id);
                      const primGuard = student.guardians.find(g => g.is_primary);
                      const secGuardians = student.guardians.filter(g => !g.is_primary);
                      
                      return (
                        <tr key={student.id}>
                          <td className="student-name-cell">
                            {student.last_name}, {student.first_name}
                          </td>
                          <td>
                            <button
                              onClick={() => setActiveCohortId(student.cohort_id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                fontWeight: 700,
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              {cohortObj ? cohortObj.name : 'Unknown'}
                            </button>
                          </td>
                          <td>{student.gender}</td>
                          <td>{student.date_of_birth}</td>
                          <td>
                            {primGuard ? (
                              <div>
                                <strong>{primGuard.full_name}</strong> ({primGuard.relationship}):{' '}
                                <span style={{ color: 'var(--color-primary)' }}>{primGuard.phone_number}</span>
                              </div>
                            ) : (
                              <span style={{ fontStyle: 'italic', opacity: 0.7 }}>No primary contact</span>
                            )}
                          </td>
                          {showSecondaryGuardians && (
                            <td>
                              {secGuardians.map(sg => (
                                <div key={sg.id} style={{ marginBottom: '4px' }}>
                                  <strong>{sg.full_name}</strong> ({sg.relationship}):{' '}
                                  <span style={{ color: 'var(--color-primary)' }}>{sg.phone_number}</span>
                                </div>
                              ))}
                              {secGuardians.length === 0 && (
                                <span style={{ fontStyle: 'italic', opacity: 0.5 }}>None</span>
                              )}
                            </td>
                          )}
                           <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                             {student.address}
                           </td>
                           <td>
                             <div className="student-actions">
                               <button
                                 type="button"
                                 className="student-action-btn"
                                 onClick={() => handleOpenStudentEditor(student)}
                                 disabled={isAppOffline}
                                 aria-label={`Edit ${student.first_name} ${student.last_name}`}
                                 title="Edit student"
                               >
                                 <Pencil size={18} />
                               </button>
                               <button
                                 type="button"
                                 className="student-action-btn student-delete-btn"
                                 onClick={() => handleDeleteStudent(student)}
                                 disabled={isAppOffline}
                                 aria-label={`Delete ${student.first_name} ${student.last_name}`}
                                 title="Delete student"
                               >
                                 <Trash2 size={18} />
                               </button>
                             </div>
                           </td>
                         </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {editingStudent && (
        <div className="student-editor-backdrop" role="presentation">
          <form className="student-editor" onSubmit={handleSaveStudent} role="dialog" aria-modal="true" aria-labelledby="student-editor-title">
            <div className="student-editor-header">
              <h2 id="student-editor-title">Edit Student</h2>
              <button type="button" className="student-action-btn" onClick={() => setEditingStudent(null)} aria-label="Close editor">
                <X size={20} />
              </button>
            </div>

            <div className="student-editor-grid">
              <label>First Name<input className="input-text" name="first_name" value={editingStudent.first_name} onChange={handleStudentEditChange} required /></label>
              <label>Last Name<input className="input-text" name="last_name" value={editingStudent.last_name} onChange={handleStudentEditChange} required /></label>
              <label>Date of Birth<input className="input-text" type="date" name="date_of_birth" value={editingStudent.date_of_birth} onChange={handleStudentEditChange} min={MIN_DATE_OF_BIRTH} max={getTodayDateString()} required /></label>
              <label>Gender<select className="select-input" name="gender" value={editingStudent.gender} onChange={handleStudentEditChange} required><option value="Male">Male</option><option value="Female">Female</option></select></label>
              <label className="student-editor-full">Address<input className="input-text" name="address" value={editingStudent.address} onChange={handleStudentEditChange} required /></label>
            </div>

            <h3>Parent/Guardian Details</h3>
            {editingStudent.guardians.map((guardian, index) => (
              <div className="student-editor-grid guardian-editor" key={guardian.id || index}>
                <strong className="student-editor-full">{index === 0 ? 'Primary Parent/Guardian' : 'Secondary Parent/Guardian'}</strong>
                <label>Full Name<input className="input-text" value={guardian.full_name} onChange={(event) => handleGuardianEditChange(index, 'full_name', event.target.value)} required /></label>
                <label>Relationship<input className="input-text" value={guardian.relationship} onChange={(event) => handleGuardianEditChange(index, 'relationship', event.target.value)} required /></label>
                <label className="student-editor-full">Phone Number<input className="input-text" value={guardian.phone_number} onChange={(event) => handleGuardianEditChange(index, 'phone_number', event.target.value)} required /></label>
              </div>
            ))}

            <div className="student-editor-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingStudent(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isAppOffline}>Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
