import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Patient {
  patientId: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  gender: string;
  birthdate: string;
  age: number;
  birthPlace: string;
  occupation: string;
  civilStatus: string;
  street: string;
  barangay: string;
  town: string;
  provinceCity: string;
  zipCode: string;
  country: string;
  mobileNumber: string;
  email: string;
  fatherName?: string;
  motherName?: string;
  validIdName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | { firstName?: string; lastName?: string; name?: string };
  updatedBy?: string | { firstName?: string; lastName?: string; name?: string };
}

interface PatientsState {
  patients: Patient[];
  isLoading: boolean;
}

const initialState: PatientsState = {
  patients: [],
  isLoading: false,
};

const patientsSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    setPatients: (state, action: PayloadAction<Patient[]>) => {
      state.patients = action.payload;
    },
    addPatient: (state, action: PayloadAction<Patient>) => {
      state.patients.unshift(action.payload);
    },
    updatePatient: (state, action: PayloadAction<Patient>) => {
      const index = state.patients.findIndex(
        (p) => p.patientId === action.payload.patientId,
      );
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
    },
    deletePatient: (state, action: PayloadAction<string>) => {
      state.patients = state.patients.filter(
        (p) => p.patientId !== action.payload,
      );
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setPatients,
  addPatient,
  updatePatient,
  deletePatient,
  setLoading,
} = patientsSlice.actions;
export default patientsSlice.reducer;
