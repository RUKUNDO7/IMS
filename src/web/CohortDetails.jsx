import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import CsvImporter from './CsvImporter';
import { ArrowLeft, Crown, Search, ShieldAlert, CheckCircle } from 'lucide-react';


export default function CohortDetails({ cohortId, onBack, isOffline }) {
  const [cohort, setCohort] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('gender'); // 'gender' or 'unified'
  const [selectedChairman, setSelectedChairman] = useState('');
  const [selectedChairperson, setSelectedChairperson] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [banner, setBanner] = useState(null); // { type: 'success'|'error', message: '' }

  const loadCohortData = () => {
    try {
      const c = db.getCohortById(cohortId);
      if (!c) throw new Error('Cohort not found');
      setCohort(c);

      const roster = db.getStudentsByCohort(cohortId);
      setStudents(roster);
      setSelectedStudentIds((current) => current.filter(id => roster.some(student => student.id === id)));

      setSelectedChairman(c.chairman_student_id || '');
      setSelectedChairperson(c.chairperson_student_id || '');
    } catch (err) {
      setBanner({ type: 'error', message: err.message });
    }
  };

  useEffect(() => {
    loadCohortData();
  }, [cohortId]);

  const handleRegToggle = (e) => {
    if (isOffline) return;
    const isChecked = e.target.checked;
    try {
      db.updateCohortRegOpen(cohortId, isChecked);
      setCohort(prev => ({ ...prev, registration_open: isChecked }));
      showBanner('success', `Self-Registration for this cohort is now ${isChecked ? 'OPEN' : 'CLOSED'}.`);
    } catch (err) {
      showBanner('error', err.message);
    }
  };

  const handleSaveLeaders = (e) => {
    e.preventDefault();
    if (isOffline) return;
    try {
      db.updateCohortLeaders(cohortId, {
        chairmanId: selectedChairman,
        chairpersonId: selectedChairperson,
      });
      loadCohortData(); // Refresh cohort record details
      showBanner('success', 'Cohort leaders have been successfully assigned.');
    } catch (err) {
      showBanner('error', err.message);
    }
  };

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => {
      setBanner(null);
    }, 5000);
  };

  if (!cohort) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: 'var(--spacing-md)' }}>
          <ArrowLeft size={20} /> Back to Cohorts
        </button>
        <div className="card" style={{ color: 'var(--color-danger)' }}>
          Cohort not found. Please go back.
        </div>
      </div>
    );
  }

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    const matchesName = `${student.first_name} ${student.last_name}`.toLowerCase().includes(query);
    return matchesName;
  });

  // Split students
  const maleStudents = filteredStudents.filter(s => s.gender === 'Male');
  const femaleStudents = filteredStudents.filter(s => s.gender === 'Female');

  // Find leadership student names
  const chairmanStudent = students.find(s => s.id === cohort.chairman_student_id);
  const chairpersonStudent = students.find(s => s.id === cohort.chairperson_student_id);

  // Available students for leaders dropdowns (restricted by gender)
  const maleCandidates = students.filter(s => s.gender === 'Male');
  const femaleCandidates = students.filter(s => s.gender === 'Female');

  // Format Date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // Return DD/MM/YYYY or readable Month DD, YYYY
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      }
    } catch (e) {}
    return dateStr;
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((current) => current.includes(studentId)
      ? current.filter(id => id !== studentId)
      : [...current, studentId]);
  };

  const toggleSelectAll = (studentList) => {
    const visibleIds = studentList.map(student => student.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedStudentIds.includes(id));
    setSelectedStudentIds((current) => allSelected
      ? current.filter(id => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  };

  const exportToExcel = () => {
    const studentsToExport = filteredStudents.filter(student => selectedStudentIds.includes(student.id));
    if (studentsToExport.length === 0) {
      showBanner('error', 'Select at least one student before downloading.');
      return;
    }

    const headers = [
      'First Name',
      'Last Name',
      'Date of Birth',
      'Gender',
      'Address',
      'Primary Guardian Name',
      'Primary Guardian Relationship',
      'Primary Guardian Phone',
      'Secondary Guardian Name',
      'Secondary Guardian Relationship',
      'Secondary Guardian Phone',
      'Source'
    ];

    const rows = studentsToExport.map((s) => {
      const pG = s.guardians.find(g => g.is_primary) || {};
      const sG = s.guardians.find(g => !g.is_primary) || {};
      return [
        s.first_name,
        s.last_name,
        s.date_of_birth,
        s.gender,
        s.address,
        pG.full_name || '',
        pG.relationship || '',
        pG.phone_number || '',
        sG.full_name || '',
        sG.relationship || '',
        sG.phone_number || '',
        s.entry_source
      ];
    });

    const escapeHtml = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const excelTable = `<table><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows
      .map(row => `<tr>${row.map(value => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const blob = new Blob([`<html><head><meta charset="UTF-8"></head><body>${excelTable}</body></html>`], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${cohort.name}_students.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSpreadsheetTable = (studentList) => {
    if (studentList.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
          No student records found.
        </div>
      );
    }

    return (
      <div className="spreadsheet-grid-container">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th className="spreadsheet-row-num">
                <input
                  type="checkbox"
                  aria-label="Select all visible students"
                  checked={studentList.length > 0 && studentList.every(student => selectedStudentIds.includes(student.id))}
                  onChange={() => toggleSelectAll(studentList)}
                />
              </th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Date of Birth</th>
              <th>Gender</th>
              <th>Address</th>
              <th>Primary Guardian Name</th>
              <th>Primary Relationship</th>
              <th>Primary Phone</th>
              <th>Secondary Guardian Name</th>
              <th>Secondary Relationship</th>
              <th>Secondary Phone</th>
              <th>Entry Source</th>
            </tr>
          </thead>
          <tbody>
            {studentList.map((student) => {
              const pG = student.guardians.find(g => g.is_primary) || {};
              const sG = student.guardians.find(g => !g.is_primary) || {};
              return (
                <tr key={student.id}>
                  <td className="spreadsheet-row-num">
                    <input
                      type="checkbox"
                      aria-label={`Select ${student.first_name} ${student.last_name}`}
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => toggleStudentSelection(student.id)}
                    />
                  </td>
                  <td>{student.first_name}</td>
                  <td>{student.last_name}</td>
                  <td>{formatDateDisplay(student.date_of_birth)}</td>
                  <td>{student.gender}</td>
                  <td>{student.address}</td>
                  <td>{pG.full_name || ''}</td>
                  <td>{pG.relationship || ''}</td>
                  <td>{pG.phone_number || ''}</td>
                  <td>{sG.full_name || ''}</td>
                  <td>{sG.relationship || ''}</td>
                  <td>{sG.phone_number || ''}</td>
                  <td>{student.entry_source === 'self_registered' ? 'Self-Reg' : 'Imported'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStudentTable = (studentList) => {
    if (studentList.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
          No student records found.
        </div>
      );
    }

    return (
      <table className="student-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date of Birth</th>
            <th>Address</th>
            <th>Guardian & Contact Information</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {studentList.map(student => {
            const isLeader = student.id === cohort.chairman_student_id || student.id === cohort.chairperson_student_id;
            return (
              <tr key={student.id}>
                <td>
                  <div className="student-name-cell">
                    <span>{student.last_name}, {student.first_name}</span>
                    {isLeader && (
                      <span className="leader-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Crown size={14} /> Leader
                      </span>
                    )}
                  </div>
                </td>
                <td>{formatDateDisplay(student.date_of_birth)}</td>
                <td>
                  <span style={{ fontSize: '0.95rem' }}>{student.address}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {student.guardians.map((g, idx) => (
                      <div key={g.id} style={{ fontSize: '0.95rem', fontWeight: g.is_primary ? '600' : 'normal' }}>
                        {g.full_name} ({g.relationship}) - <span style={{ color: 'var(--color-primary)' }}>{g.phone_number}</span>
                        {g.is_primary && <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', marginLeft: '4px' }}>(Primary)</span>}
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`student-source-badge ${student.entry_source === 'self_registered' ? 'source-self' : 'source-imported'}`}>
                    {student.entry_source === 'self_registered' ? 'Self-Reg' : 'Imported'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: 'var(--spacing-md)' }}>
        <ArrowLeft size={20} /> Back to Cohorts
      </button>

      {isOffline && (
        <div className="banner banner-error" style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={28} />
          <span><strong>Offline Mode</strong> - Internet connection required to save changes. Writes are disabled.</span>
        </div>
      )}

      {banner && (
        <div className={`banner banner-${banner.type}`}>
          {banner.type === 'success' ? <CheckCircle size={28} /> : <ShieldAlert size={28} />}
          <span>{banner.message}</span>
        </div>
      )}

      {/* Cohort Detail Banner */}
      <div className="cohort-detail-banner">
        <h1 style={{ color: '#FFFFFF' }}>{cohort.name}</h1>
        <p style={{ fontSize: '1.1rem', margin: 0, opacity: 0.9 }}>
          Start Year: <strong>{cohort.start_year}</strong> | Total Registered: <strong>{students.length} students</strong>
        </p>

        <div className="cohort-leaders-strip">
          <div className="leader-item">
            <Crown size={20} style={{ color: 'var(--color-accent)' }} />
            <span>Chairman: </span>
            {chairmanStudent ? (
              <span className="leader-badge">{chairmanStudent.first_name} {chairmanStudent.last_name}</span>
            ) : (
              <span style={{ fontStyle: 'italic', opacity: 0.8 }}>Not Assigned</span>
            )}
          </div>

          <div className="leader-item">
            <Crown size={20} style={{ color: 'var(--color-accent)' }} />
            <span>Chairperson: </span>
            {chairpersonStudent ? (
              <span className="leader-badge">{chairpersonStudent.first_name} {chairpersonStudent.last_name}</span>
            ) : (
              <span style={{ fontStyle: 'italic', opacity: 0.8 }}>Not Assigned</span>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        {/* Registration Access Toggle */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--spacing-sm)' }}>Registration Access</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Control whether prospective students can fill out the self-registration form online for this cohort.
          </p>
          <div className="toggle-switch-container" style={{ marginTop: 'var(--spacing-md)' }}>
            <span className="toggle-switch-label">
              Registration is {cohort.registration_open ? 'Open' : 'Closed'}
            </span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={cohort.registration_open}
                onChange={handleRegToggle}
                disabled={isOffline}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          {cohort.registration_open && (
            <div style={{ marginTop: 'var(--spacing-md)', padding: '12px', background: '#F1F5F9', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>Shareable Student Registration Link:</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/register.html`}
                  className="input-text"
                  style={{ minHeight: '36px', height: '36px', padding: '0 8px', fontSize: '0.85rem', flexGrow: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ minHeight: '36px', height: '36px', padding: '0 12px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/register.html`);
                    alert('Copied to clipboard!');
                  }}
                >
                  Copy
                </button>
                <a
                  href={`${window.location.origin}/register.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ minHeight: '36px', height: '36px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                >
                  Open
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Assign Leaders Card */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 'var(--spacing-sm)' }}>Assign Year 2 Leaders</h3>
          <form onSubmit={handleSaveLeaders}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.95rem' }}>Male Leader (Chairman)</label>
                <select
                  className="select-input"
                  value={selectedChairman}
                  onChange={(e) => setSelectedChairman(e.target.value)}
                  style={{ minHeight: '48px' }}
                  disabled={isOffline}
                >
                  <option value="">-- Choose Chairman --</option>
                  {maleCandidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.last_name}, {c.first_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.95rem' }}>Female Leader (Chairperson)</label>
                <select
                  className="select-input"
                  value={selectedChairperson}
                  onChange={(e) => setSelectedChairperson(e.target.value)}
                  style={{ minHeight: '48px' }}
                  disabled={isOffline}
                >
                  <option value="">-- Choose Chairperson --</option>
                  {femaleCandidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.last_name}, {c.first_name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ minHeight: '48px', marginTop: '4px' }} disabled={isOffline}>
                <Crown size={20} /> Save Cohort Leaders
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="roster-controls-card">
        <div className="roster-toolbar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by student name..."
              className="input-text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          <div className="roster-toggle-group">
            <button
              className={`roster-toggle-btn ${viewMode === 'unified' ? 'active' : ''}`}
              onClick={() => setViewMode('unified')}
            >
              Full List
            </button>
            <button
              className={`roster-toggle-btn ${viewMode === 'spreadsheet' ? 'active' : ''}`}
              onClick={() => setViewMode('spreadsheet')}
            >
              Spreadsheet View
            </button>
            <button
              className={`roster-toggle-btn ${viewMode === 'gender' ? 'active' : ''}`}
              onClick={() => setViewMode('gender')}
            >
              Split by Gender
            </button>
          </div>
        </div>
      </div>

      {/* Roster List Display */}
      {viewMode === 'spreadsheet' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-md)' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={exportToExcel}
            style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            Download Excel File ({selectedStudentIds.length})
          </button>
        </div>
      )}
      <div className="student-list-container">
        {viewMode === 'gender' ? (
          <>
            <div className="gender-section">
              <h3 className="gender-section-header">Boys List ({maleStudents.length})</h3>
              {renderStudentTable(maleStudents)}
            </div>

            <div className="gender-section">
              <h3 className="gender-section-header">Girls List ({femaleStudents.length})</h3>
              {renderStudentTable(femaleStudents)}
            </div>
          </>
        ) : viewMode === 'spreadsheet' ? (
          <div className="gender-section">
            <h3 className="gender-section-header">Spreadsheet View ({filteredStudents.length})</h3>
            {renderSpreadsheetTable(filteredStudents)}
          </div>
        ) : (
          <div className="gender-section">
            <h3 className="gender-section-header">All Registered Students ({filteredStudents.length})</h3>
            {renderStudentTable(filteredStudents)}
          </div>
        )}
      </div>

      {/* Importer Section */}
      <div style={{ marginTop: 'var(--spacing-xl)' }}>
        <CsvImporter cohortId={cohortId} onImportSuccess={loadCohortData} isOffline={isOffline} />
      </div>
    </div>
  );
}
