// Mock Database Service mapping PostgreSQL schema using localStorage

const STORAGE_KEYS = {
  COHORTS: 'ims_cohorts',
  STUDENTS: 'ims_students',
  GUARDIANS: 'ims_guardians',
};

const MIN_STUDENT_DATE_OF_BIRTH = '2000-01-01';

const getTodayDateString = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

const isValidStudentDateOfBirth = (dateOfBirth) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return false;

  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return isRealDate && dateOfBirth >= MIN_STUDENT_DATE_OF_BIRTH && dateOfBirth <= getTodayDateString();
};

// Simple fallback UUID generator if crypto.randomUUID is not available
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Initial seeding of data if storage is empty
const seedDatabase = () => {
  const existingCohorts = localStorage.getItem(STORAGE_KEYS.COHORTS);
  if (existingCohorts) return; // already seeded

  // Seed Cohorts 1 to 7
  const initialCohorts = [];
  const startYearBase = 2019; // Cohort 1 starts in 2019

  for (let i = 1; i <= 7; i++) {
    initialCohorts.push({
      id: generateUUID(),
      name: `Cohort ${i}`,
      start_year: startYearBase + i - 1,
      chairman_student_id: null,
      chairperson_student_id: null,
      registration_open: i === 7, // Open registration for the latest cohort (Cohort 7)
      created_at: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Seed some students for Cohort 7 (latest cohort) to give immediate interactive data
  const cohort7 = initialCohorts.find(c => c.name === 'Cohort 7');
  const initialStudents = [];
  const initialGuardians = [];

  const seedStudentData = [
    { first_name: 'David', last_name: 'Miller', dob: '2008-04-12', gender: 'Male', address: '128 Pinecrest Rd, Heights', primary_parent: { name: 'Sarah Miller', relation: 'Mother', phone: '+1 555-0199' }, secondary_parent: { name: 'Robert Miller', relation: 'Father', phone: '+1 555-0198' } },
    { first_name: 'Grace', last_name: 'Abbott', dob: '2008-09-25', gender: 'Female', address: '45 Oak Ave, Riverdale', primary_parent: { name: 'Helen Abbott', relation: 'Grandparent', phone: '+1 555-0122' } },
    { first_name: 'James', last_name: 'Smith', dob: '2008-01-30', gender: 'Male', address: '782 Elm St, Westwood', primary_parent: { name: 'Arthur Smith', relation: 'Father', phone: '+1 555-0144' } },
    { first_name: 'Chloe', last_name: 'Davis', dob: '2008-11-05', gender: 'Female', address: '12 Maple Blvd, Heights', primary_parent: { name: 'Karen Davis', relation: 'Mother', phone: '+1 555-0188' } },
    { first_name: 'Emily', last_name: 'Brown', dob: '2008-07-19', gender: 'Female', address: '900 Cedar Ln, Riverdale', primary_parent: { name: 'Paul Brown', relation: 'Father', phone: '+1 555-0133' }, secondary_parent: { name: 'Mary Brown', relation: 'Mother', phone: '+1 555-0134' } },
    { first_name: 'Michael', last_name: 'Taylor', dob: '2008-06-15', gender: 'Male', address: '34 Spruce Court, Westwood', primary_parent: { name: 'Sandra Taylor', relation: 'Mother', phone: '+1 555-0155' } },
  ];

  seedStudentData.forEach(s => {
    const studentId = generateUUID();
    initialStudents.push({
      id: studentId,
      cohort_id: cohort7.id,
      first_name: s.first_name,
      last_name: s.last_name,
      date_of_birth: s.dob,
      gender: s.gender,
      address: s.address,
      entry_source: 'imported',
      created_at: new Date().toISOString(),
    });

    // Primary Guardian
    initialGuardians.push({
      id: generateUUID(),
      student_id: studentId,
      full_name: s.primary_parent.name,
      relationship: s.primary_parent.relation,
      phone_number: s.primary_parent.phone,
      is_primary: true,
    });

    // Secondary Guardian (if present)
    if (s.secondary_parent) {
      initialGuardians.push({
        id: generateUUID(),
        student_id: studentId,
        full_name: s.secondary_parent.name,
        relationship: s.secondary_parent.relation,
        phone_number: s.secondary_parent.phone,
        is_primary: false,
      });
    }
  });

  // Assign leaders for Cohort 7
  const firstMale = initialStudents.find(s => s.gender === 'Male');
  const firstFemale = initialStudents.find(s => s.gender === 'Female');
  if (firstMale) cohort7.chairman_student_id = firstMale.id;
  if (firstFemale) cohort7.chairperson_student_id = firstFemale.id;

  localStorage.setItem(STORAGE_KEYS.COHORTS, JSON.stringify(initialCohorts));
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
  localStorage.setItem(STORAGE_KEYS.GUARDIANS, JSON.stringify(initialGuardians));
};

// Helper reads
const readData = (key) => {
  seedDatabase(); // Make sure seed data exists
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading localStorage key', key, e);
    return [];
  }
};

const writeData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  // Cohorts Table Functions
  getCohorts: () => {
    return readData(STORAGE_KEYS.COHORTS).sort((a, b) => b.start_year - a.start_year);
  },

  getCohortById: (id) => {
    const cohorts = readData(STORAGE_KEYS.COHORTS);
    return cohorts.find(c => c.id === id) || null;
  },

  createCohort: ({ name, start_year }) => {
    const cohorts = readData(STORAGE_KEYS.COHORTS);
    
    // Validate uniqueness of name
    if (cohorts.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error(`A cohort named "${name}" already exists.`);
    }

    const newCohort = {
      id: generateUUID(),
      name: name.trim(),
      start_year: parseInt(start_year, 10),
      chairman_student_id: null,
      chairperson_student_id: null,
      registration_open: false,
      created_at: new Date().toISOString(),
    };

    cohorts.push(newCohort);
    writeData(STORAGE_KEYS.COHORTS, cohorts);
    return newCohort;
  },

  updateCohortLeaders: (cohortId, { chairmanId, chairpersonId }) => {
    const cohorts = readData(STORAGE_KEYS.COHORTS);
    const index = cohorts.findIndex(c => c.id === cohortId);
    if (index === -1) throw new Error('Cohort not found');

    // Optional validation: verify if students belong to the cohort and are correct gender
    const students = readData(STORAGE_KEYS.STUDENTS);
    if (chairmanId) {
      const maleStudent = students.find(s => s.id === chairmanId);
      if (!maleStudent || maleStudent.cohort_id !== cohortId || maleStudent.gender !== 'Male') {
        throw new Error('Invalid student chosen for Chairman (must be male and in this cohort).');
      }
    }
    if (chairpersonId) {
      const femaleStudent = students.find(s => s.id === chairpersonId);
      if (!femaleStudent || femaleStudent.cohort_id !== cohortId || femaleStudent.gender !== 'Female') {
        throw new Error('Invalid student chosen for Chairperson (must be female and in this cohort).');
      }
    }

    cohorts[index].chairman_student_id = chairmanId || null;
    cohorts[index].chairperson_student_id = chairpersonId || null;
    writeData(STORAGE_KEYS.COHORTS, cohorts);
    return cohorts[index];
  },

  updateCohortRegOpen: (cohortId, open) => {
    const cohorts = readData(STORAGE_KEYS.COHORTS);
    const index = cohorts.findIndex(c => c.id === cohortId);
    if (index === -1) throw new Error('Cohort not found');

    cohorts[index].registration_open = !!open;
    writeData(STORAGE_KEYS.COHORTS, cohorts);
    return cohorts[index];
  },

  // Students & Guardians Functions
  getStudentsByCohort: (cohortId) => {
    const students = readData(STORAGE_KEYS.STUDENTS);
    const guardians = readData(STORAGE_KEYS.GUARDIANS);

    const cohortStudents = students.filter(s => s.cohort_id === cohortId);
    
    // Attach guardians and sort alphabetically by last_name, first_name
    return cohortStudents.map(student => {
      const studentGuardians = guardians.filter(g => g.student_id === student.id);
      return {
        ...student,
        guardians: studentGuardians,
      };
    }).sort((a, b) => {
      const lastCompare = a.last_name.localeCompare(b.last_name);
      if (lastCompare !== 0) return lastCompare;
      return a.first_name.localeCompare(b.first_name);
    });
  },

  getAllStudents: () => {
    const students = readData(STORAGE_KEYS.STUDENTS);
    const guardians = readData(STORAGE_KEYS.GUARDIANS);
    return students.map(student => {
      return {
        ...student,
        guardians: guardians.filter(g => g.student_id === student.id),
      };
    });
  },

  addStudent: (studentData, guardiansList) => {
    const students = readData(STORAGE_KEYS.STUDENTS);
    const guardians = readData(STORAGE_KEYS.GUARDIANS);

    if (!isValidStudentDateOfBirth(studentData.date_of_birth)) {
      throw new Error('Date of birth must be between January 1, 2000 and today.');
    }

    const studentId = generateUUID();
    const newStudent = {
      id: studentId,
      cohort_id: studentData.cohort_id,
      first_name: studentData.first_name.trim(),
      last_name: studentData.last_name.trim(),
      date_of_birth: studentData.date_of_birth,
      gender: studentData.gender,
      address: studentData.address.trim(),
      entry_source: studentData.entry_source || 'self_registered',
      created_at: new Date().toISOString(),
    };

    const newGuardians = guardiansList.map((g, idx) => ({
      id: generateUUID(),
      student_id: studentId,
      full_name: g.full_name.trim(),
      relationship: g.relationship,
      phone_number: g.phone_number.trim(),
      is_primary: idx === 0, // Mark the first one as primary
    }));

    // Transaction-like write
    students.push(newStudent);
    writeData(STORAGE_KEYS.STUDENTS, students);

    guardians.push(...newGuardians);
    writeData(STORAGE_KEYS.GUARDIANS, guardians);

    return {
      ...newStudent,
      guardians: newGuardians,
    };
  },

  updateStudent: (studentId, studentData, guardiansList) => {
    const students = readData(STORAGE_KEYS.STUDENTS);
    const guardians = readData(STORAGE_KEYS.GUARDIANS);
    const studentIndex = students.findIndex(student => student.id === studentId);

    if (studentIndex === -1) throw new Error('Student not found');
    if (!studentData.first_name?.trim() || !studentData.last_name?.trim()) {
      throw new Error('First and last names are required.');
    }
    if (!studentData.date_of_birth || !studentData.gender || !studentData.address?.trim()) {
      throw new Error('Date of birth, gender, and address are required.');
    }
    if (!isValidStudentDateOfBirth(studentData.date_of_birth)) {
      throw new Error('Date of birth must be between January 1, 2000 and today.');
    }
    if (!guardiansList.length || guardiansList.some(guardian => !guardian.full_name?.trim() || !guardian.relationship?.trim() || !guardian.phone_number?.trim())) {
      throw new Error('Each guardian needs a name, relationship, and phone number.');
    }

    const existingStudent = students[studentIndex];
    students[studentIndex] = {
      ...existingStudent,
      first_name: studentData.first_name.trim(),
      last_name: studentData.last_name.trim(),
      date_of_birth: studentData.date_of_birth,
      gender: studentData.gender,
      address: studentData.address.trim(),
    };

    const otherGuardians = guardians.filter(guardian => guardian.student_id !== studentId);
    const updatedGuardians = guardiansList.map((guardian, index) => ({
      id: guardian.id || generateUUID(),
      student_id: studentId,
      full_name: guardian.full_name.trim(),
      relationship: guardian.relationship.trim(),
      phone_number: guardian.phone_number.trim(),
      is_primary: index === 0,
    }));

    writeData(STORAGE_KEYS.STUDENTS, students);
    writeData(STORAGE_KEYS.GUARDIANS, [...otherGuardians, ...updatedGuardians]);
    return { ...students[studentIndex], guardians: updatedGuardians };
  },

  deleteStudent: (studentId) => {
    const students = readData(STORAGE_KEYS.STUDENTS);
    const studentExists = students.some(student => student.id === studentId);
    if (!studentExists) throw new Error('Student not found');

    const cohorts = readData(STORAGE_KEYS.COHORTS).map(cohort => ({
      ...cohort,
      chairman_student_id: cohort.chairman_student_id === studentId ? null : cohort.chairman_student_id,
      chairperson_student_id: cohort.chairperson_student_id === studentId ? null : cohort.chairperson_student_id,
    }));

    writeData(STORAGE_KEYS.STUDENTS, students.filter(student => student.id !== studentId));
    writeData(STORAGE_KEYS.GUARDIANS, readData(STORAGE_KEYS.GUARDIANS).filter(guardian => guardian.student_id !== studentId));
    writeData(STORAGE_KEYS.COHORTS, cohorts);
  },

  // Transactional CSV Parser & Importer
  importStudentsFromCSV: (cohortId, csvText) => {
    const lines = csvText.split(/\r?\n/);
    if (lines.length <= 1) {
      return { success: false, errors: ['CSV file is empty or only contains a header.'] };
    }

    // Basic CSV Line Parser (handles quotes correctly)
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[\s_/]/g, ''));
    
    // Expected headers mapping:
    // firstname, lastname, dob/dateofbirth, gender, address, 
    // primaryguardianname, primaryguardianrelationship, primaryguardianphone,
    // secondaryguardianname, secondaryguardianrelationship, secondaryguardianphone
    
    const requiredHeaders = [
      'firstname', 'lastname', 'dateofbirth', 'gender', 'address',
      'primaryguardianname', 'primaryguardianrelationship', 'primaryguardianphone'
    ];

    const missingHeaders = requiredHeaders.filter(req => !headers.includes(req));
    if (missingHeaders.length > 0) {
      return {
        success: false,
        errors: [`Missing required columns: ${missingHeaders.join(', ')}. Please use the template.`]
      };
    }

    const valErrors = [];
    const parsedData = [];

    const validGenders = ['Male', 'Female'];
    const validRelationships = ['Mother', 'Father', 'Guardian', 'Grandparent', 'Sibling', 'Other'];

    // Read remaining lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // skip empty lines

      const rowNum = i + 1; // 1-indexed row number in file
      const cells = parseCSVLine(line);

      // Create object map
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = cells[idx] || '';
      });

      const rowErrors = [];

      // Validate Student Info
      if (!row.firstname) rowErrors.push('First Name is required');
      if (!row.lastname) rowErrors.push('Last Name is required');
      if (!row.address) rowErrors.push('Address is required');

      // Validate Gender
      let genderNormalized = '';
      if (!row.gender) {
        rowErrors.push('Gender is required');
      } else {
        genderNormalized = row.gender.charAt(0).toUpperCase() + row.gender.slice(1).toLowerCase();
        if (!validGenders.includes(genderNormalized)) {
          rowErrors.push(`Gender must be 'Male' or 'Female' (got: '${row.gender}')`);
        }
      }

      // Validate DOB
      let dobFormatted = '';
      if (!row.dateofbirth) {
        rowErrors.push('Date of Birth is required');
      } else {
        // Try parsing YYYY-MM-DD
        const dateMatch = row.dateofbirth.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (dateMatch) {
          const y = parseInt(dateMatch[1], 10);
          const m = parseInt(dateMatch[2], 10) - 1;
          const d = parseInt(dateMatch[3], 10);
          const date = new Date(y, m, d);
          if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
            dobFormatted = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          }
        }
        
        // Try standard Date parsing as fallback
        if (!dobFormatted) {
          const parsedDate = new Date(row.dateofbirth);
          if (!isNaN(parsedDate.getTime())) {
            dobFormatted = parsedDate.toISOString().split('T')[0];
          } else {
            rowErrors.push(`Invalid Date of Birth format (expected YYYY-MM-DD, got: '${row.dateofbirth}')`);
          }
        }

        if (dobFormatted && !isValidStudentDateOfBirth(dobFormatted)) {
          rowErrors.push('Date of Birth must be between January 1, 2000 and today');
        }
      }

      // Validate Primary Guardian Info
      if (!row.primaryguardianname) rowErrors.push('Primary Guardian Name is required');
      if (!row.primaryguardianphone) rowErrors.push('Primary Guardian Phone Number is required');
      
      let primRelationNormalized = '';
      if (!row.primaryguardianrelationship) {
        rowErrors.push('Primary Guardian Relationship is required');
      } else {
        primRelationNormalized = row.primaryguardianrelationship.charAt(0).toUpperCase() + row.primaryguardianrelationship.slice(1).toLowerCase();
        if (!validRelationships.includes(primRelationNormalized)) {
          rowErrors.push(`Primary Guardian Relationship must be one of: ${validRelationships.join(', ')} (got: '${row.primaryguardianrelationship}')`);
        }
      }

      // Validate Secondary Guardian (optional)
      let secRelationNormalized = '';
      if (row.secondaryguardianname || row.secondaryguardianrelationship || row.secondaryguardianphone) {
        if (!row.secondaryguardianname) rowErrors.push('Secondary Guardian Name is required if other secondary details are provided');
        if (!row.secondaryguardianphone) rowErrors.push('Secondary Guardian Phone Number is required if other secondary details are provided');
        
        if (!row.secondaryguardianrelationship) {
          rowErrors.push('Secondary Guardian Relationship is required if other secondary details are provided');
        } else {
          secRelationNormalized = row.secondaryguardianrelationship.charAt(0).toUpperCase() + row.secondaryguardianrelationship.slice(1).toLowerCase();
          if (!validRelationships.includes(secRelationNormalized)) {
            rowErrors.push(`Secondary Guardian Relationship must be one of: ${validRelationships.join(', ')} (got: '${row.secondaryguardianrelationship}')`);
          }
        }
      }

      if (rowErrors.length > 0) {
        valErrors.push(`Row ${rowNum}: ${rowErrors.join('; ')}`);
      } else {
        // Collect parsed row data
        parsedData.push({
          student: {
            cohort_id: cohortId,
            first_name: row.firstname,
            last_name: row.lastname,
            date_of_birth: dobFormatted,
            gender: genderNormalized,
            address: row.address,
            entry_source: 'imported',
          },
          guardians: [
            {
              full_name: row.primaryguardianname,
              relationship: primRelationNormalized,
              phone_number: row.primaryguardianphone,
              is_primary: true,
            },
            ...(row.secondaryguardianname ? [{
              full_name: row.secondaryguardianname,
              relationship: secRelationNormalized,
              phone_number: row.secondaryguardianphone,
              is_primary: false,
            }] : []),
          ]
        });
      }
    }

    // If there were any errors, roll back (do not write any records)
    if (valErrors.length > 0) {
      return { success: false, errors: valErrors };
    }

    // Transactional write: save all parsed rows
    const students = readData(STORAGE_KEYS.STUDENTS);
    const guardians = readData(STORAGE_KEYS.GUARDIANS);

    parsedData.forEach(data => {
      const studentId = generateUUID();
      students.push({
        id: studentId,
        ...data.student,
        created_at: new Date().toISOString(),
      });

      data.guardians.forEach(g => {
        guardians.push({
          id: generateUUID(),
          student_id: studentId,
          ...g,
        });
      });
    });

    writeData(STORAGE_KEYS.STUDENTS, students);
    writeData(STORAGE_KEYS.GUARDIANS, guardians);

    return { success: true, count: parsedData.length };
  }
};
