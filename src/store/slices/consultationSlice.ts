import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Medicine {
  id: string;
  genericName: string;
  brandName: string;
  formulation: string;
  signa: string;
  quantity: string;
}

export interface Laboratory {
  id: string;
  testName: string;
  testResults: string;
  summary: string;
}

export interface ConsultationAttachment {
  id: string;
  name: string;
  uploadedAt: string;
  size: string;
  type: string;
  fileData: string; // Base64 data
}

export interface ConsultationRecord {
  id: string;
  caseNumber: string; // Link to FPE record
  consultationDate: string;

  // Patient Details (auto-filled from FPE)
  patientName: string;
  birthdate: string;
  age: number;
  civilStatus: string;
  gender: string;

  // Main Complaint
  mainComplaint: string;

  // Vital Signs
  vitalSigns: {
    temperature?: number;
    respiratoryRate?: number;
    cardiacRate?: number;
    bloodPressure?: string;
    weight?: number;
    height?: number;
  };

  // Pertinent Physical Examination
  physicalExam: {
    heent: string[];
    heentOthers?: string;
    chestBreastLungs: string[];
    chestBreastLungsOthers?: string;
    heart: string[];
    heartOthers?: string;
    abdomen: string[];
    abdomenOthers?: string;
    genitourinary: string[];
    genitourinaryOthers?: string;
    digitalRectal: string[];
    digitalRectalOthers?: string;
    skinExtremities: string[];
    skinExtremitiesOthers?: string;
    neurological: string[];
    neurologicalOthers?: string;
  };

  // PCU
  pcu: 'YES' | 'NO' | '';

  // Diagnosis
  diagnosis: string;

  // Plan
  plan: string;

  // Medicines
  medicines: Medicine[];

  // Laboratory
  laboratories: Laboratory[];

  // Remarks
  remarks: string;

  // Doctor
  doctor: string;

  // EKAS
  ekas: {
    enabled: boolean;
    tests: string[];
  };

  // EPRESS
  epress: {
    enabled: boolean;
    medicines: Medicine[];
  };

  // eKonsulta
  eKonsulta: boolean;

  // Attachments
  attachments: ConsultationAttachment[];

  status: 'Draft' | 'Completed';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

interface ConsultationState {
  consultations: ConsultationRecord[];
  isLoading: boolean;
}

const initialState: ConsultationState = {
  consultations: [],
  isLoading: false,
};

const consultationSlice = createSlice({
  name: 'consultation',
  initialState,
  reducers: {
    addConsultation: (state, action: PayloadAction<ConsultationRecord>) => {
      state.consultations.unshift(action.payload);
    },
    updateConsultation: (state, action: PayloadAction<ConsultationRecord>) => {
      const index = state.consultations.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.consultations[index] = action.payload;
      }
    },
    deleteConsultation: (state, action: PayloadAction<string>) => {
      state.consultations = state.consultations.filter((c) => c.id !== action.payload);
    },
    addConsultationAttachments: (state, action: PayloadAction<{ consultationId: string; attachments: ConsultationAttachment[] }>) => {
      const consultation = state.consultations.find((c) => c.id === action.payload.consultationId);
      if (consultation) {
        consultation.attachments = [...(consultation.attachments || []), ...action.payload.attachments];
      }
    },
    deleteConsultationAttachment: (state, action: PayloadAction<{ consultationId: string; attachmentId: string }>) => {
      const consultation = state.consultations.find((c) => c.id === action.payload.consultationId);
      if (consultation) {
        consultation.attachments = consultation.attachments.filter((a) => a.id !== action.payload.attachmentId);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { addConsultation, updateConsultation, deleteConsultation, addConsultationAttachments, deleteConsultationAttachment, setLoading } = consultationSlice.actions;
export default consultationSlice.reducer;
