import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User, Phone, MapPin, Calendar, Users, CheckCircle, Plus, Trash2, AlertCircle } from 'lucide-react';
import rwandaHierarchy from '../services/rwanda_hierarchy.json';

const MIN_DATE_OF_BIRTH = '2000-01-01';

const getTodayDateString = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

export default function StudentRegistration() {
  const [openCohorts, setOpenCohorts] = useState([]);
  const [formData, setFormData] = useState({
    cohort_id: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    address: '',
  });

  const [primaryGuardian, setPrimaryGuardian] = useState({
    full_name: '',
    relationship: '',
    phone_number: '',
  });

  const [secondaryGuardian, setSecondaryGuardian] = useState({
    full_name: '',
    relationship: '',
    phone_number: '',
  });

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCell, setSelectedCell] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  const [showSecondary, setShowSecondary] = useState(false);
  const [banner, setBanner] = useState(null); // { type: 'success'|'error', message: '' }

  useEffect(() => {
    // Load open cohorts
    const allCohorts = db.getCohorts();
    const open = allCohorts.filter(c => c.registration_open);
    setOpenCohorts(open);
    if (open.length > 0) {
      setFormData(prev => ({ ...prev, cohort_id: open[0].id }));
    }
  }, []);

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrimaryChange = (e) => {
    const { name, value } = e.target;
    setPrimaryGuardian(prev => ({ ...prev, [name]: value }));
  };

  const handleSecondaryChange = (e) => {
    const { name, value } = e.target;
    setSecondaryGuardian(prev => ({ ...prev, [name]: value }));
  };

  const validateRwandanPhone = (phone) => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const regex = /^(?:\+250|0)?7[2389]\d{7}$/;
    return regex.test(cleanPhone);
  };

  const validateForm = () => {
    if (!formData.cohort_id) return 'Please select a class to join.';
    if (!formData.first_name.trim()) return 'First Name is required.';
    if (!formData.last_name.trim()) return 'Last Name is required.';
    if (!formData.date_of_birth) return 'Date of Birth is required.';
    if (formData.date_of_birth < MIN_DATE_OF_BIRTH || formData.date_of_birth > getTodayDateString()) {
      return 'Date of Birth must be between January 1, 2000 and today.';
    }
    if (!formData.gender) return 'Please select your gender.';
    
    if (!selectedProvince) return 'Please select a Province.';
    if (!selectedDistrict) return 'Please select a District.';
    if (!selectedSector) return 'Please select a Sector.';
    if (!selectedCell) return 'Please select a Cell.';
    if (!selectedVillage) return 'Please select a Village.';

    if (!primaryGuardian.full_name.trim()) return 'Primary Parent/Guardian Name is required.';
    if (!primaryGuardian.relationship) return 'Please select your relationship to the primary parent/guardian.';
    if (!primaryGuardian.phone_number.trim()) return 'Primary Parent/Guardian Phone Number is required.';
    if (!validateRwandanPhone(primaryGuardian.phone_number)) {
      return 'Primary Parent/Guardian Phone Number must be a valid Rwandan phone number (e.g. +250 788 123 456 or 0788 123 456).';
    }

    if (showSecondary) {
      if (!secondaryGuardian.full_name.trim()) return 'Secondary Parent/Guardian Name is required (or click Remove secondary parent/guardian).';
      if (!secondaryGuardian.relationship) return 'Please select your relationship to the secondary parent/guardian.';
      if (!secondaryGuardian.phone_number.trim()) return 'Secondary Parent/Guardian Phone Number is required.';
      if (!validateRwandanPhone(secondaryGuardian.phone_number)) {
        return 'Secondary Parent/Guardian Phone Number must be a valid Rwandan phone number (e.g. +250 788 123 456 or 0788 123 456).';
      }
    }

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setBanner(null);

    const error = validateForm();
    if (error) {
      setBanner({ type: 'error', message: error });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const guardians = [primaryGuardian];
      if (showSecondary) {
        guardians.push(secondaryGuardian);
      }

      const combinedAddress = `${selectedProvince}, ${selectedDistrict}, ${selectedSector}, ${selectedCell}, ${selectedVillage}`;
      const updatedFormData = {
        ...formData,
        address: combinedAddress
      };

      db.addStudent(updatedFormData, guardians);

      setBanner({
        type: 'success',
        message: `Saved Successfully ✓ Welcome, ${formData.first_name}! Your self-registration has been submitted.`
      });

      // Reset form (keep cohort selection)
      setFormData(prev => ({
        cohort_id: prev.cohort_id,
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        address: '',
      }));
      setSelectedProvince('');
      setSelectedDistrict('');
      setSelectedSector('');
      setSelectedCell('');
      setSelectedVillage('');
      setPrimaryGuardian({ full_name: '', relationship: '', phone_number: '' });
      setSecondaryGuardian({ full_name: '', relationship: '', phone_number: '' });
      setShowSecondary(false);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'An unexpected error occurred.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (openCohorts.length === 0) {
    return (
      <div className="card" style={{ maxWidth: '720px', margin: '40px auto', textAlign: 'center', padding: '60px var(--spacing-xl)' }}>
        <AlertCircle size={64} style={{ color: 'var(--color-danger)', marginBottom: 'var(--spacing-md)' }} />
        <h2 style={{ fontSize: '1.8rem' }}>Registration is Closed</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto var(--spacing-xl) auto' }}>
          There are currently no active classes accepting self-registration. Please check back later or contact the class administration office.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-xl) 0' }}>
      <div className="card" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', textAlign: 'center', color: 'var(--color-primary)', marginBottom: 'var(--spacing-xs)' }}>
          Student Self-Registration
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', fontSize: '1.1rem' }}>
          Complete this form to register for upcoming courses.
        </p>

        {banner && (
          <div className={`banner banner-${banner.type}`}>
            {banner.type === 'success' ? <CheckCircle size={28} /> : <AlertCircle size={28} />}
            <span>{banner.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-layout">
          {/* Cohort Selection Section */}
          <div className="form-section">
            <h2 className="form-section-title">
              <Users size={24} /> Class Selection
            </h2>
            <div className="form-group">
              <label htmlFor="cohort_id" className="form-label">Which intake or group are you joining?</label>
              <select
                id="cohort_id"
                name="cohort_id"
                className="select-input"
                value={formData.cohort_id}
                onChange={handleStudentChange}
                required
              >
                {openCohorts.map(cohort => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name} ({cohort.start_year} Intake)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 1: Student Information */}
          <div className="form-section">
            <h2 className="form-section-title">
              <User size={24} /> Student Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label htmlFor="first_name" className="form-label">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  className="input-text"
                  value={formData.first_name}
                  onChange={handleStudentChange}
                  placeholder="e.g. John"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  className="input-text"
                  value={formData.last_name}
                  onChange={handleStudentChange}
                  placeholder="e.g. Smith"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label htmlFor="date_of_birth" className="form-label">Date of Birth</label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  className="input-text"
                  value={formData.date_of_birth}
                  onChange={handleStudentChange}
                  min={MIN_DATE_OF_BIRTH}
                  max={getTodayDateString()}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  className="select-input"
                  value={formData.gender}
                  onChange={handleStudentChange}
                  required
                >
                  <option value="">-- Select Gender --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label htmlFor="province" className="form-label">Province</label>
                <select
                  id="province"
                  className="select-input"
                  value={selectedProvince}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedProvince(val);
                    setSelectedDistrict('');
                    setSelectedSector('');
                    setSelectedCell('');
                    setSelectedVillage('');
                  }}
                  required
                >
                  <option value="">-- Select Province --</option>
                  {Object.keys(rwandaHierarchy).map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="district" className="form-label">District</label>
                <select
                  id="district"
                  className="select-input"
                  value={selectedDistrict}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedDistrict(val);
                    setSelectedSector('');
                    setSelectedCell('');
                    setSelectedVillage('');
                  }}
                  disabled={!selectedProvince}
                  required
                >
                  <option value="">-- Select District --</option>
                  {selectedProvince && Object.keys(rwandaHierarchy[selectedProvince]).map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label htmlFor="sector" className="form-label">Sector</label>
                <select
                  id="sector"
                  className="select-input"
                  value={selectedSector}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSector(val);
                    setSelectedCell('');
                    setSelectedVillage('');
                  }}
                  disabled={!selectedDistrict}
                  required
                >
                  <option value="">-- Select Sector --</option>
                  {selectedProvince && selectedDistrict && Object.keys(rwandaHierarchy[selectedProvince][selectedDistrict]).map(sect => (
                    <option key={sect} value={sect}>{sect}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="cell" className="form-label">Cell</label>
                <select
                  id="cell"
                  className="select-input"
                  value={selectedCell}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCell(val);
                    setSelectedVillage('');
                  }}
                  disabled={!selectedSector}
                  required
                >
                  <option value="">-- Select Cell --</option>
                  {selectedProvince && selectedDistrict && selectedSector && Object.keys(rwandaHierarchy[selectedProvince][selectedDistrict][selectedSector]).map(cell => (
                    <option key={cell} value={cell}>{cell}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="village" className="form-label">Village</label>
              <select
                id="village"
                className="select-input"
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                disabled={!selectedCell}
                required
              >
                <option value="">-- Select Village --</option>
                {selectedProvince && selectedDistrict && selectedSector && selectedCell && rwandaHierarchy[selectedProvince][selectedDistrict][selectedSector][selectedCell].map(vill => (
                  <option key={vill} value={vill}>{vill}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Primary Parent/Guardian */}
          <div className="form-section">
            <h2 className="form-section-title">
              <Users size={24} /> Primary Parent / Legal Guardian
            </h2>
            <p className="form-subtext">
              Please enter the details of the parent, relative, or adult responsible for you.
            </p>

            <div className="form-group">
              <label htmlFor="p_full_name" className="form-label">Full Name</label>
              <input
                type="text"
                id="p_full_name"
                name="full_name"
                className="input-text"
                value={primaryGuardian.full_name}
                onChange={handlePrimaryChange}
                placeholder="Parent/Guardian Full Name"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label htmlFor="p_relationship" className="form-label">Relationship to Student</label>
                <select
                  id="p_relationship"
                  name="relationship"
                  className="select-input"
                  value={primaryGuardian.relationship}
                  onChange={handlePrimaryChange}
                  required
                >
                  <option value="">-- Select Relationship --</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="p_phone_number" className="form-label">Phone Number</label>
                <input
                  type="tel"
                  id="p_phone_number"
                  name="phone_number"
                  className="input-text"
                  value={primaryGuardian.phone_number}
                  onChange={handlePrimaryChange}
                  placeholder="+250 788 123 456"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Secondary Parent/Guardian (Optional) */}
          <div className="form-section" style={{ borderBottom: 'none' }}>
            {!showSecondary ? (
              <button
                type="button"
                className="add-secondary-link"
                onClick={() => setShowSecondary(true)}
              >
                <Plus size={22} /> Add second parent/guardian (optional)
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="form-section-title" style={{ margin: 0 }}>
                    <Users size={24} /> Secondary Parent / Guardian
                  </h2>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ minHeight: '44px', height: '44px', padding: '0 var(--spacing-md)' }}
                    onClick={() => {
                      setShowSecondary(false);
                      setSecondaryGuardian({ full_name: '', relationship: '', phone_number: '' });
                    }}
                  >
                    <Trash2 size={18} /> Remove
                  </button>
                </div>
                <p className="form-subtext">
                  Leave this section blank if you only have one parent or guardian.
                </p>

                <div className="form-group">
                  <label htmlFor="s_full_name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="s_full_name"
                    name="full_name"
                    className="input-text"
                    value={secondaryGuardian.full_name}
                    onChange={handleSecondaryChange}
                    placeholder="Second Parent/Guardian Full Name"
                    required={showSecondary}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                  <div className="form-group">
                    <label htmlFor="s_relationship" className="form-label">Relationship to Student</label>
                    <select
                      id="s_relationship"
                      name="relationship"
                      className="select-input"
                      value={secondaryGuardian.relationship}
                      onChange={handleSecondaryChange}
                      required={showSecondary}
                    >
                      <option value="">-- Select Relationship --</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="s_phone_number" className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      id="s_phone_number"
                      name="phone_number"
                      className="input-text"
                      value={secondaryGuardian.phone_number}
                      onChange={handleSecondaryChange}
                      placeholder="+250 788 123 456"
                      required={showSecondary}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <CheckCircle size={22} /> Submit Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
