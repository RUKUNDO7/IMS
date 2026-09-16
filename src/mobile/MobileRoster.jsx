import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import MobileRosterCard from './MobileRosterCard';
import { ArrowLeft, Search, Users, Award, ShieldAlert } from 'lucide-react';

export default function MobileRoster({ cohortId, onBack, isOffline, offlineTime }) {
  const [cohort, setCohort] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all'); // 'all' | 'male' | 'female'

  const loadData = () => {
    try {
      const c = db.getCohortById(cohortId);
      if (c) {
        setCohort(c);
        const list = db.getStudentsByCohort(cohortId);
        setStudents(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [cohortId]);

  if (!cohort) {
    return (
      <div className="mobile-view-padding">
        <button className="btn-mobile-back" onClick={onBack} style={{ minHeight: '56px' }}>
          <ArrowLeft size={20} /> <span>Back to Classes</span>
        </button>
        <div className="mobile-info-alert error mt-4">
          <ShieldAlert size={20} />
          <div>Class not found.</div>
        </div>
      </div>
    );
  }

  // Filter lists
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.guardians?.some(g => g.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || g.phone_number.includes(searchQuery));
    
    const matchesGender = 
      genderFilter === 'all' || 
      (genderFilter === 'male' && s.gender === 'Male') || 
      (genderFilter === 'female' && s.gender === 'Female');

    return matchesSearch && matchesGender;
  });

  // Count genders for badges
  const totalMale = students.filter(s => s.gender === 'Male').length;
  const totalFemale = students.filter(s => s.gender === 'Female').length;

  return (
    <div className="mobile-roster-view">
      {/* Back button and title */}
      <div className="mobile-nav-header">
        <button className="btn-mobile-back" onClick={onBack} style={{ minHeight: '56px' }}>
          <ArrowLeft size={22} />
          <span>Back</span>
        </button>
        <h2 className="mobile-nav-title">{cohort.name} List</h2>
      </div>

      {/* Offline Alert - Stale-while-revalidate indicator */}
      {isOffline && (
        <div className="mobile-info-alert offline-notice">
          <ShieldAlert size={18} className="alert-icon" />
          <div className="alert-content">
            <span className="alert-title">🛜 Offline Mode</span>
          <span className="alert-desc">Viewing saved student list (Last updated: {offlineTime})</span>
          </div>
        </div>
      )}

      {/* Cohort Leadership Info Card */}
      <div className="mobile-card leadership-summary-card">
        <div className="leadership-summary-header">
          <Award size={20} className="header-icon" />
          <h4>Class Leaders</h4>
        </div>
        <div className="leadership-names-row">
          <div className="leader-name-cell">
            <span className="leader-label">Chairman (Male)</span>
            <span className="leader-value">
              {cohort.chairman_student_id
                ? (() => {
                    const s = students.find(x => x.id === cohort.chairman_student_id);
                    return s ? `${s.first_name} ${s.last_name}` : 'Unknown student';
                  })()
                : 'Not Assigned'}
            </span>
          </div>
          <div className="leader-name-cell">
            <span className="leader-label">Chairperson (Female)</span>
            <span className="leader-value">
              {cohort.chairperson_student_id
                ? (() => {
                    const s = students.find(x => x.id === cohort.chairperson_student_id);
                    return s ? `${s.first_name} ${s.last_name}` : 'Unknown student';
                  })()
                : 'Not Assigned'}
            </span>
          </div>
        </div>
      </div>

      {/* Search Input wrapper */}
      <div className="mobile-search-bar-container">
        <div className="search-input-wrapper-mobile">
          <Search size={18} className="search-icon-mobile" />
          <input
            type="text"
            className="input-text-mobile"
            placeholder="Search name, phone, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minHeight: '48px' }}
          />
        </div>
      </div>

      {/* Gender Tab Filters - 56px minimum touch height */}
      <div className="mobile-gender-filters">
        <button
          className={`btn-gender-filter ${genderFilter === 'all' ? 'active' : ''}`}
          onClick={() => setGenderFilter('all')}
          style={{ minHeight: '52px' }}
        >
          <span>All ({students.length})</span>
        </button>
        <button
          className={`btn-gender-filter ${genderFilter === 'male' ? 'active' : ''}`}
          onClick={() => setGenderFilter('male')}
          style={{ minHeight: '52px' }}
        >
          <span>Boys ({totalMale})</span>
        </button>
        <button
          className={`btn-gender-filter ${genderFilter === 'female' ? 'active' : ''}`}
          onClick={() => setGenderFilter('female')}
          style={{ minHeight: '52px' }}
        >
          <span>Girls ({totalFemale})</span>
        </button>
      </div>

      {/* Cards List */}
      <div className="mobile-cards-container">
        {filteredStudents.length === 0 ? (
          <div className="no-records-mobile">
            No student records match search criteria.
          </div>
        ) : (
          filteredStudents.map(student => {
            const isLeader =
              student.id === cohort.chairman_student_id ||
              student.id === cohort.chairperson_student_id;
            const leaderTitle =
              student.id === cohort.chairman_student_id
                ? 'Chairman'
                : student.id === cohort.chairperson_student_id
                ? 'Chairperson'
                : '';

            return (
              <MobileRosterCard
                key={student.id}
                student={student}
                isLeader={isLeader}
                leaderTitle={leaderTitle}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
