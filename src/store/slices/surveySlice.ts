import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SurveyResponse {
  id: string;
  date: string;
  department: string;
  overallRating: number;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  ratings: {
    laboratory?: number[];
    xray?: number[];
    pharmacy?: number[];
    doctor?: number[];
    nurse?: number[];
    nursingAttendant?: number[];
    utilityWorker?: number[];
    food?: number[];
    billing?: number[];
    cashier?: number[];
    securityGuard?: number[];
  };
  feedback?: {
    laboratory?: string;
    xray?: string;
    pharmacy?: string;
    doctor?: string;
    nurse?: string;
    nursingAttendant?: string;
    utilityWorker?: string;
    food?: string;
    billing?: string;
    cashier?: string;
    securityGuard?: string;
  };
}

interface SurveyState {
  responses: SurveyResponse[];
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

const initialState: SurveyState = {
  responses: [
    {
      id: 'SUR-001',
      date: createDate(0, 2),
      department: 'Pharmacy',
      overallRating: 4.5,
      sentiment: 'Positive',
      ratings: {
        pharmacy: [5, 5, 4, 5],
      },
      feedback: {
        pharmacy: 'Mabilis ang serbisyo at maayos ang pagtrato',
      },
    },
    {
      id: 'SUR-002',
      date: createDate(0, 5),
      department: 'Doctor',
      overallRating: 4.8,
      sentiment: 'Positive',
      ratings: {
        doctor: [5, 5, 5, 4, 5],
        nurse: [5, 5, 4],
      },
      feedback: {
        doctor: 'Napakagaling ng doktor, malinaw ang paliwanag',
        nurse: 'Friendly at professional ang mga nurses',
      },
    },
    {
      id: 'SUR-003',
      date: createDate(1),
      department: 'Billing',
      overallRating: 2.5,
      sentiment: 'Negative',
      ratings: {
        billing: [2, 3, 2, 3],
        cashier: [3, 2],
      },
      feedback: {
        billing: 'Matagal ang proseso sa billing, kailangan ng improvement',
        cashier: 'Medyo matagal din ang pila sa cashier',
      },
    },
    {
      id: 'SUR-004',
      date: createDate(1, 3),
      department: 'Nurse',
      overallRating: 4.7,
      sentiment: 'Positive',
      ratings: {
        nurse: [5, 5, 4, 5, 5, 4],
      },
      feedback: {
        nurse: 'Mabait at attentive ang mga nurses',
      },
    },
    {
      id: 'SUR-005',
      date: createDate(2),
      department: 'Laboratory',
      overallRating: 4.3,
      sentiment: 'Positive',
      ratings: {
        laboratory: [4, 5, 4],
        xray: [4, 4],
      },
      feedback: {
        laboratory: 'Mabilis ang resulta ng laboratory',
        xray: 'Maayos din ang xray facility',
      },
    },
    {
      id: 'SUR-006',
      date: createDate(2, 4),
      department: 'X-Ray',
      overallRating: 4.6,
      sentiment: 'Positive',
      ratings: {
        xray: [5, 5, 4, 4],
      },
    },
    {
      id: 'SUR-007',
      date: createDate(3),
      department: 'Food',
      overallRating: 3.2,
      sentiment: 'Neutral',
      ratings: {
        food: [3, 3, 4, 3],
        utilityWorker: [4, 4],
      },
      feedback: {
        food: 'Pwede pang pagandahin ang lasa ng pagkain',
        utilityWorker: 'Malinis naman ang kapaligiran',
      },
    },
    {
      id: 'SUR-008',
      date: createDate(3, 6),
      department: 'Cashier',
      overallRating: 4.4,
      sentiment: 'Positive',
      ratings: {
        cashier: [4, 5, 4],
      },
    },
    {
      id: 'SUR-009',
      date: createDate(4),
      department: 'Security Guard',
      overallRating: 4.9,
      sentiment: 'Positive',
      ratings: {
        securityGuard: [5, 5, 5],
      },
      feedback: {
        securityGuard: 'Napakabait at helpful ng security',
      },
    },
    {
      id: 'SUR-010',
      date: createDate(5),
      department: 'Pharmacy',
      overallRating: 2.8,
      sentiment: 'Negative',
      ratings: {
        pharmacy: [3, 2, 3, 3],
        doctor: [2, 3],
      },
      feedback: {
        pharmacy: 'Medyo matagal maghintay ng gamot',
        doctor: 'Kulang ang doctors sa schedule na ito',
      },
    },
  ],
  isLoading: false,
};

const surveySlice = createSlice({
  name: 'survey',
  initialState,
  reducers: {
    addSurveyResponse: (state, action: PayloadAction<SurveyResponse>) => {
      state.responses.unshift(action.payload);
    },
  },
});

export const { addSurveyResponse } = surveySlice.actions;
export default surveySlice.reducer;
