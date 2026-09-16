import React from 'react';
import { Phone, MapPin, User, Award } from 'lucide-react';

export default function MobileRosterCard({ student, isLeader, leaderTitle }) {
  const primaryGuardian = student.guardians?.find(g => g.is_primary);
  const secondaryGuardians = student.guardians?.filter(g => !g.is_primary) || [];

  return (
    <div className={`mobile-card student-card ${isLeader ? 'leader-highlight' : ''}`}>
      <div className="mobile-card-header">
        <div className="mobile-card-name-section">
          <h3 className="mobile-card-title">
            {student.first_name} {student.last_name}
          </h3>
          <span className={`badge-gender ${student.gender.toLowerCase()}`}>
            {student.gender}
          </span>
        </div>
        {isLeader && (
          <span className="badge-leader">
            <Award size={16} /> {leaderTitle || 'Leader'}
          </span>
        )}
      </div>

      <div className="mobile-card-body">
        {/* DOB & Address */}
        <div className="info-row">
          <User size={16} className="info-icon" />
          <span>DOB: {student.date_of_birth}</span>
        </div>
        
        <div className="info-row align-start">
          <MapPin size={16} className="info-icon mt-1" />
          <span className="info-text">{student.address}</span>
        </div>

        {/* Primary Guardian Contact - MUST be 56px touch target */}
        <div className="guardian-contact-section">
          <div className="guardian-header">Primary Contact</div>
          {primaryGuardian ? (
            <a
              href={`tel:${primaryGuardian.phone_number.replace(/\s+/g, '')}`}
              className="guardian-touch-target"
            >
              <div className="guardian-info">
                <span className="guardian-name">{primaryGuardian.full_name}</span>
                <span className="guardian-relation">({primaryGuardian.relationship})</span>
              </div>
              <div className="guardian-phone-action">
                <Phone size={20} />
                <span className="phone-number">{primaryGuardian.phone_number}</span>
              </div>
            </a>
          ) : (
            <div className="no-contact-notice">No primary contact registered</div>
          )}
        </div>

        {/* Secondary Guardian Contacts */}
        {secondaryGuardians.length > 0 && (
          <div className="secondary-contacts-section">
            <div className="guardian-header">Secondary Contacts</div>
            {secondaryGuardians.map(g => (
              <a
                key={g.id}
                href={`tel:${g.phone_number.replace(/\s+/g, '')}`}
                className="guardian-touch-target secondary"
              >
                <div className="guardian-info">
                  <span className="guardian-name">{g.full_name}</span>
                  <span className="guardian-relation">({g.relationship})</span>
                </div>
                <div className="guardian-phone-action">
                  <Phone size={18} />
                  <span className="phone-number">{g.phone_number}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
