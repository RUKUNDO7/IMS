import React, { useState } from 'react';
import { db } from '../services/db';
import MobileRosterCard from './MobileRosterCard';
import { Search, Info } from 'lucide-react';

export default function MobileSearch({ cohorts }) {
  const [searchQuery, setSearchQuery] = useState('');
  const allStudents = db.getAllStudents();

  // Filter students globally
  const filteredStudents = allStudents.filter(student => {
    const query = searchQuery.toLowerCase();
    if (!query) return false; // Show nothing or everything? In mobile search, let's show all or nothing based on length. If query is empty, let's display a message or all.
    // Let's show filtered lists when query is present. If query is empty, let's show a prompt or some recent records. Let's show a prompt to start searching.
    const matchesName = `${student.first_name} ${student.last_name}`.toLowerCase().includes(query);
    return matchesName;
  });
  const nameOptions = searchQuery.trim()
    ? allStudents
      .filter(student => `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 6)
    : [];

  return (
    <div className="mobile-search-view">
      <div className="mobile-welcome-banner search-banner">
        <h2 className="mobile-welcome-title mobile-welcome-title-with-icon">
          <Search size={26} aria-hidden="true" />
          <span>Quick Search</span>
        </h2>
        <p className="mobile-welcome-subtitle">Search by student name</p>
      </div>

      {/* Global Search Bar */}
      <div className="mobile-search-bar-container border-b">
        <div className="search-input-wrapper-mobile">
          <Search size={18} className="search-icon-mobile" />
          <input
            type="text"
            className="input-text-mobile"
            placeholder="Type a student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minHeight: '52px' }}
          />
        </div>
        {nameOptions.length > 0 && (
          <div className="search-name-options" role="listbox" aria-label="Matching student names">
            {nameOptions.map(student => (
              <button
                key={student.id}
                type="button"
                className="search-name-option"
                onClick={() => setSearchQuery(`${student.first_name} ${student.last_name}`)}
              >
                {student.first_name} {student.last_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search results */}
      <div className="mobile-cards-container pt-4">
        {searchQuery.trim() === '' ? (
          <div className="search-placeholder-mobile">
            <Info size={36} className="placeholder-icon" />
            <div className="placeholder-text">Start typing a student name to see matching students.</div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="no-records-mobile">
            No matching students found for "{searchQuery}".
          </div>
        ) : (
          filteredStudents.map(student => {
            // Find the cohort details
            const cohortObj = cohorts.find(c => c.id === student.cohort_id);
            const isLeader = cohortObj
              ? student.id === cohortObj.chairman_student_id || student.id === cohortObj.chairperson_student_id
              : false;
            const leaderTitle = cohortObj
              ? student.id === cohortObj.chairman_student_id
                ? 'Chairman'
                : student.id === cohortObj.chairperson_student_id
                ? 'Chairperson'
                : ''
              : '';

            return (
              <div key={student.id} className="search-result-card-wrapper">
                {/* Cohort Header for context */}
                <div className="search-cohort-tag font-display">
                  🏢 {cohortObj ? cohortObj.name : 'Unknown Class'}
                </div>
                <MobileRosterCard
                  student={student}
                  isLeader={isLeader}
                  leaderTitle={leaderTitle}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
