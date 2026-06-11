import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface PatientFlowMetrics {
  id: string;
  date: string;
  opdPatients: number;
  erPatients: number;
  admissions: number;
  discharges: number;
  incomingReferrals: number;
  outgoingReferrals: number;
  deaths: number;
  enteredBy: string;
  createdAt: string;
}

interface PatientFlowState {
  metrics: PatientFlowMetrics[];
  isLoading: boolean;
}

// Fixed base date for dummy data (May 1, 2026)
const BASE_DATE = new Date('2026-05-01T08:00:00Z');

const createDate = (daysAgo: number, hoursAgo: number = 0) => {
  const date = new Date(BASE_DATE);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

const initialState: PatientFlowState = {
  metrics: [
    {
      id: 'PFM-001',
      date: '2026-05-12',
      opdPatients: 45,
      erPatients: 12,
      admissions: 8,
      discharges: 6,
      incomingReferrals: 3,
      outgoingReferrals: 2,
      deaths: 0,
      enteredBy: 'Maria Santos',
      createdAt: createDate(0, 2),
    },
    {
      id: 'PFM-002',
      date: '2026-05-11',
      opdPatients: 52,
      erPatients: 15,
      admissions: 10,
      discharges: 7,
      incomingReferrals: 4,
      outgoingReferrals: 1,
      deaths: 1,
      enteredBy: 'Ana Cruz',
      createdAt: createDate(1, 3),
    },
    {
      id: 'PFM-003',
      date: '2026-05-10',
      opdPatients: 38,
      erPatients: 10,
      admissions: 5,
      discharges: 8,
      incomingReferrals: 2,
      outgoingReferrals: 3,
      deaths: 0,
      enteredBy: 'Maria Santos',
      createdAt: createDate(2, 4),
    },
    {
      id: 'PFM-004',
      date: '2026-05-09',
      opdPatients: 48,
      erPatients: 18,
      admissions: 12,
      discharges: 5,
      incomingReferrals: 5,
      outgoingReferrals: 2,
      deaths: 0,
      enteredBy: 'Ana Cruz',
      createdAt: createDate(3, 2),
    },
    {
      id: 'PFM-005',
      date: '2026-05-08',
      opdPatients: 41,
      erPatients: 14,
      admissions: 7,
      discharges: 9,
      incomingReferrals: 3,
      outgoingReferrals: 4,
      deaths: 1,
      enteredBy: 'Maria Santos',
      createdAt: createDate(4, 5),
    },
  ],
  isLoading: false,
};

const patientFlowSlice = createSlice({
  name: 'patientFlow',
  initialState,
  reducers: {
    addPatientFlowMetrics: (state, action: PayloadAction<PatientFlowMetrics>) => {
      state.metrics.unshift(action.payload);
    },
    updatePatientFlowMetrics: (state, action: PayloadAction<PatientFlowMetrics>) => {
      const index = state.metrics.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.metrics[index] = action.payload;
      }
    },
    deletePatientFlowMetrics: (state, action: PayloadAction<string>) => {
      state.metrics = state.metrics.filter((m) => m.id !== action.payload);
    },
  },
});

export const { addPatientFlowMetrics, updatePatientFlowMetrics, deletePatientFlowMetrics } = patientFlowSlice.actions;
export default patientFlowSlice.reducer;
