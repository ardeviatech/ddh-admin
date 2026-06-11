import { type FPERecord } from '../store/slices/fpeSlice';

export function generateCaseNumber(fpeRecords: FPERecord[]): string {
  if (fpeRecords.length === 0) {
    return 'FPE-00001';
  }

  // Find the maximum case number
  const maxCaseNumber = fpeRecords.reduce((max, record) => {
    const caseNum = parseInt(record.caseNumber.split('-')[1]);
    return Math.max(max, caseNum);
  }, 0);

  const newCaseNumber = maxCaseNumber + 1;
  return `FPE-${String(newCaseNumber).padStart(5, '0')}`;
}

export function calculateBMI(weight?: number, height?: number): number | undefined {
  if (!weight || !height || height === 0) return undefined;
  // BMI = weight(kg) / (height(m))^2
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
}
