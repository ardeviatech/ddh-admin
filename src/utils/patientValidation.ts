import { type Patient } from '../store/slices/patientsSlice';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedPatient?: Patient;
  matchReason?: string;
}

export function checkDuplicatePatient(
  patients: Patient[],
  formData: {
    firstName: string;
    lastName: string;
    birthdate: string;
    gender?: string;
  }
): DuplicateCheckResult {
  const matches: Patient[] = [];

  // Normalize birthdate to YYYY-MM-DD format
  const normalizeDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  const formBirthdate = normalizeDate(formData.birthdate);

  for (const patient of patients) {
    const nameMatch =
      patient.firstName.toLowerCase() === formData.firstName.toLowerCase() &&
      patient.lastName.toLowerCase() === formData.lastName.toLowerCase();

    const patientBirthdate = normalizeDate(patient.birthdate);
    const birthdateMatch = patientBirthdate === formBirthdate;

    if (nameMatch && birthdateMatch) {
      matches.push(patient);
    }
  }

  if (matches.length > 0) {
    // Check if gender also matches for high confidence
    const genderMatch = formData.gender && matches[0].gender === formData.gender;

    return {
      isDuplicate: true,
      matchedPatient: matches[0],
      matchReason: genderMatch
        ? 'High Match: Same name, birthdate, and gender found'
        : 'Possible existing patient found with similar information',
    };
  }

  return { isDuplicate: false };
}

export function generatePatientId(patients: Patient[]): string {
  if (patients.length === 0) {
    return 'DDH-00001';
  }

  // Find the maximum ID number from all patients
  const maxIdNumber = patients.reduce((max, patient) => {
    const idNumber = parseInt(patient.patientId.split('-')[1]);
    return Math.max(max, idNumber);
  }, 0);

  const newIdNumber = maxIdNumber + 1;
  return `DDH-${String(newIdNumber).padStart(5, '0')}`;
}

export function calculateAge(birthdate: Date): number {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
