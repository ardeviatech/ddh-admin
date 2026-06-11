import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface DocumentFile {
  id: string;
  name: string;
  uploadedAt: string;
  size: string;
  type: string;
  fileData?: string;
}

export interface FPERecord {
  caseNumber: string;
  patientId: string;
  patientName: string;
  eKonsulta: boolean;
  philhealthNumber: string;
  philhealthType: "Member" | "Dependent";
  dateCreated: string;
  lastUpdated: string;
  year: number;
  documents?: DocumentFile[];
  pastMedicalHistory: {
    conditions: Record<string, boolean>;
    specifiedAllergy?: string;
    specifiedCancerOrgan?: string;
    specifiedHepatitisType?: string;
    highestBloodPressure?: string;
    pulmonaryTBCategory?: string;
    extraPulmonaryTBCategory?: string;
    others?: string;
  };
  pastSurgicalHistory: {
    none?: boolean;
    operation?: string;
    date?: string;
  };
  familyHistory: {
    conditions: Record<string, boolean>;
    specifiedAllergy?: string;
    specifiedCancerOrgan?: string;
    specifiedHepatitisType?: string;
    highestBloodPressure?: string;
    pulmonaryTBCategory?: string;
    extraPulmonaryTBCategory?: string;
    others?: string;
  };
  personalHistory: {
    smoking: "YES" | "NO" | "QUIT" | "";
    packsPerYear?: number;
    alcohol: "YES" | "NO" | "QUIT" | "";
    bottlesPerDay?: number;
    illicitDrugs: "YES" | "NO" | "";
    sexuallyActive: "YES" | "NO" | "";
  };
  immunization: {
    children?: string[];
    adult?: string[];
    pregnant?: string[];
    elderly?: string[];
    othersSpecify?: string;
  };
  familyPlanning: { hasAccess: "YES" | "NO" | "" };
  menstrualHistory?: Record<string, any>;
  pregnancyHistory?: Record<string, any>;
  physicalExamination: Record<string, any>;
  pertinentFindings: Record<string, string[]>;
  ncdAssessment?: Record<string, any>;
  finalDiagnosis?: string;
  remarks?: string;
  status: "Draft" | "Completed";
  createdBy?: string;
  updatedBy?: string;
}

interface FPEState {
  fpeRecords: FPERecord[];
  isLoading: boolean;
}

export const createFPEDate = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day).toISOString();

export const getCurrentYear = () => new Date().getFullYear();

export const hasValidFPE = (
  patientId: string,
  fpeRecords: FPERecord[],
): boolean =>
  fpeRecords.some(
    (fpe) =>
      fpe.patientId === patientId &&
      fpe.year === getCurrentYear() &&
      fpe.status === "Completed",
  );

export const getCurrentYearFPE = (patientId: string, fpeRecords: FPERecord[]) =>
  fpeRecords.find(
    (fpe) => fpe.patientId === patientId && fpe.year === getCurrentYear(),
  );

export const getMostRecentFPE = (
  patientId: string,
  fpeRecords: FPERecord[],
) => {
  const patientFPEs = fpeRecords.filter((f) => f.patientId === patientId);
  if (patientFPEs.length === 0) return undefined;
  return patientFPEs.reduce((latest, current) => {
    if (current.year > latest.year) return current;
    if (
      current.year === latest.year &&
      new Date(current.dateCreated) > new Date(latest.dateCreated)
    )
      return current;
    return latest;
  });
};

export const getPatientFPEHistory = (
  patientId: string,
  fpeRecords: FPERecord[],
) =>
  fpeRecords
    .filter((fpe) => fpe.patientId === patientId)
    .sort((a, b) =>
      b.year !== a.year
        ? b.year - a.year
        : new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
    );

export const needsFPERenewal = (patientId: string, fpeRecords: FPERecord[]) =>
  !hasValidFPE(patientId, fpeRecords);

export const getFPEStatus = (patientId: string, fpeRecords: FPERecord[]) => {
  const current = getCurrentYearFPE(patientId, fpeRecords);
  if (!current) {
    const mostRecent = getMostRecentFPE(patientId, fpeRecords);
    return mostRecent ? "Expired" : "Pending";
  }
  return current.status === "Completed" ? "Completed" : "In Progress";
};

const initialState: FPEState = {
  fpeRecords: [],
  isLoading: false,
};

const fpeSlice = createSlice({
  name: "fpe",
  initialState,
  reducers: {
    setFPERecords: (state, action: PayloadAction<FPERecord[]>) => {
      state.fpeRecords = action.payload;
    },
    addFPE: (state, action: PayloadAction<FPERecord>) => {
      state.fpeRecords.unshift(action.payload);
    },
    updateFPE: (state, action: PayloadAction<FPERecord>) => {
      const index = state.fpeRecords.findIndex(
        (f) => f.caseNumber === action.payload.caseNumber,
      );
      if (index !== -1) state.fpeRecords[index] = action.payload;
    },
    deleteFPE: (state, action: PayloadAction<string>) => {
      state.fpeRecords = state.fpeRecords.filter(
        (f) => f.caseNumber !== action.payload,
      );
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addDocuments: (
      state,
      action: PayloadAction<{ caseNumber: string; documents: DocumentFile[] }>,
    ) => {
      const index = state.fpeRecords.findIndex(
        (f) => f.caseNumber === action.payload.caseNumber,
      );
      if (index !== -1) {
        if (!state.fpeRecords[index].documents)
          state.fpeRecords[index].documents = [];
        state.fpeRecords[index].documents!.push(...action.payload.documents);
      }
    },
    deleteDocument: (
      state,
      action: PayloadAction<{ caseNumber: string; documentId: string }>,
    ) => {
      const index = state.fpeRecords.findIndex(
        (f) => f.caseNumber === action.payload.caseNumber,
      );
      if (index !== -1 && state.fpeRecords[index].documents) {
        state.fpeRecords[index].documents = state.fpeRecords[
          index
        ].documents!.filter((d) => d.id !== action.payload.documentId);
      }
    },
  },
});

export const {
  setFPERecords,
  addFPE,
  updateFPE,
  deleteFPE,
  setLoading,
  addDocuments,
  deleteDocument,
} = fpeSlice.actions;
export default fpeSlice.reducer;
