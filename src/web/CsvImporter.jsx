import React, { useState } from 'react';
import { db } from '../services/db';
import { Upload, Download, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

export default function CsvImporter({ cohortId, onImportSuccess, isOffline }) {
  const [errors, setErrors] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleDownloadTemplate = () => {
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
      'Secondary Guardian Phone'
    ];

    const sampleRow1 = [
      'Robert',
      'Johnson',
      '2008-05-14',
      'Male',
      '742 Evergreen Terrace, Springfield',
      'Marge Johnson',
      'Mother',
      '555-0101',
      'Homer Johnson',
      'Father',
      '555-0102'
    ];

    const sampleRow2 = [
      'Lisa',
      'Simpson',
      '2009-02-21',
      'Female',
      '742 Evergreen Terrace, Springfield',
      'Marge Simpson',
      'Mother',
      '555-0101',
      '',
      '',
      ''
    ];

    const csvContent = [
      headers.join(','),
      sampleRow1.map(val => `"${val}"`).join(','),
      sampleRow2.map(val => `"${val}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cohort_import_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    if (isOffline) return;
    const file = e.target.files[0];
    if (!file) return;
    
    setFileName(file.name);
    setErrors([]);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      
      // Perform database CSV import
      const result = db.importStudentsFromCSV(cohortId, text);
      
      if (result.success) {
        setSuccessMsg(`Import Successful! Added ${result.count} students and their guardians to the student list.`);
        setFileName('');
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        setErrors(result.errors);
      }
    };
    reader.onerror = () => {
      setErrors(['Failed to read the file. Please try again.']);
    };
    reader.readAsText(file);
  };

  return (
    <div className="card">
      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={24} style={{ color: 'var(--color-primary)' }} /> Bulk CSV Import
      </h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
        Upload a spreadsheet saved as a CSV file to add multiple students and parents at once.
      </p>

      {successMsg && (
        <div className="banner banner-success">
          <CheckCircle size={28} />
          <span>{successMsg}</span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="import-errors-list">
          <div className="import-errors-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={24} />
            <span>Import Failed — No Data Was Saved</span>
          </div>
          <p style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.95rem' }}>
            To prevent duplicates or incomplete profiles, the import was rolled back. Please fix the following errors and upload again:
          </p>
          <div className="import-errors-scroller">
            <ul>
              {errors.map((err, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        {isOffline ? (
          <div className="import-drag-zone" style={{ opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#F1F5F9' }}>
            <Upload className="import-icon" size={48} style={{ color: 'var(--text-secondary)' }} />
            <div className="import-instruction">
              ⚠️ Import Disabled - Offline
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-danger)', fontWeight: '600' }}>
              Internet connection is required to import records.
            </span>
          </div>
        ) : (
          <label className="import-drag-zone" htmlFor="csv-file-picker">
            <Upload className="import-icon" size={48} />
            <div className="import-instruction">
              {fileName ? `Selected: ${fileName}` : 'Click here to choose a CSV file'}
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Supports standard CSV files exported from Excel or Google Sheets
            </span>
            <input
              type="file"
              id="csv-file-picker"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
        <button
          type="button"
          className="import-template-download"
          onClick={handleDownloadTemplate}
        >
          <Download size={20} /> Download Sample CSV Template
        </button>
      </div>
    </div>
  );
}
