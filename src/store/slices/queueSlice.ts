import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type QueueStatus = "Waiting" | "Serving" | "Done";

export interface QueuePatient {
  id: string;
  queueNumber: string;
  fullName: string;
  department: string;
  status: QueueStatus;
  timeAdded: string;
  notes?: string;
  calledAt?: string;
  completedAt?: string;
}

interface QueueState {
  patients: QueuePatient[];
  queueCounters: Record<string, number>;
  lastResetDate: string; // Track last reset date
  calledHistory: string[]; // Stack of patient IDs that were called via "Call Next"
}

const initialState: QueueState = {
  patients: [],
  queueCounters: {},
  lastResetDate: new Date().toDateString(),
  calledHistory: [],
};

const queueSlice = createSlice({
  name: "queue",
  initialState,
  reducers: {
    addQueuePatient: (
      state,
      action: PayloadAction<
        Omit<QueuePatient, "id" | "queueNumber" | "timeAdded">
      >,
    ) => {
      const department = action.payload.department;

      // Initialize counter for department if it doesn't exist
      if (!state.queueCounters[department]) {
        state.queueCounters[department] = 0;
      }

      // Increment counter
      state.queueCounters[department]++;

      const newPatient: QueuePatient = {
        ...action.payload,
        id: `Q-${Date.now()}`,
        queueNumber: `${department.substring(0, 3).toUpperCase()}-${String(state.queueCounters[department]).padStart(3, "0")}`,
        timeAdded: new Date().toISOString(),
      };

      state.patients.unshift(newPatient);
    },
    addQueueEntryFromServer: (state, action: PayloadAction<QueuePatient>) => {
      const payload = action.payload;
      // avoid duplicates
      if (state.patients.some((p) => p.id === payload.id)) return;

      // try to update counter for department using numeric suffix if present
      try {
        const match = payload.queueNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          state.queueCounters[payload.department] = Math.max(
            state.queueCounters[payload.department] || 0,
            num,
          );
        }
      } catch (e) {
        // ignore
      }

      state.patients.unshift(payload);
    },
    updateQueuePatient: (state, action: PayloadAction<QueuePatient>) => {
      const index = state.patients.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
    },
    callPatient: (state, action: PayloadAction<string>) => {
      const patient = state.patients.find((p) => p.id === action.payload);
      if (patient) {
        patient.status = "Serving";
        patient.calledAt = new Date().toISOString();
      }
    },
    // Push to history and call — use this instead of callPatient for "Call Next" flow
    pushCalledHistory: (state, action: PayloadAction<string>) => {
      state.calledHistory.push(action.payload);
    },
    callPreviousPatient: (state) => {
      // Pop the most recently called patient ID from history
      const prevId = state.calledHistory.pop();
      if (!prevId) return;

      // Mark the current serving patient(s) back to Waiting
      state.patients.forEach((p) => {
        if (p.status === "Serving") {
          p.status = "Waiting";
          p.calledAt = undefined;
        }
      });

      // Restore the previous patient to Serving
      const prev = state.patients.find((p) => p.id === prevId);
      if (prev) {
        prev.status = "Serving";
        prev.completedAt = undefined;
        prev.calledAt = new Date().toISOString();
      }
    },
    skipPatient: (state, action: PayloadAction<string>) => {
      const patient = state.patients.find((p) => p.id === action.payload);
      if (patient && patient.status === "Serving") {
        patient.status = "Waiting";
        patient.calledAt = undefined;
      }
    },
    markPatientDone: (state, action: PayloadAction<string>) => {
      const patient = state.patients.find((p) => p.id === action.payload);
      if (patient) {
        patient.status = "Done";
        patient.completedAt = new Date().toISOString();
      }
    },
    recallPatient: (state, action: PayloadAction<string>) => {
      const patient = state.patients.find((p) => p.id === action.payload);
      if (patient && patient.status === "Done") {
        patient.status = "Serving";
        patient.completedAt = undefined;
        patient.calledAt = new Date().toISOString();
      }
    },
    removeQueuePatient: (state, action: PayloadAction<string>) => {
      state.patients = state.patients.filter((p) => p.id !== action.payload);
    },
    resetDailyQueue: (state) => {
      state.patients = [];
      state.queueCounters = {};
      state.calledHistory = [];
      state.lastResetDate = new Date().toDateString();
    },
  },
});

export const {
  addQueuePatient,
  updateQueuePatient,
  callPatient,
  pushCalledHistory,
  callPreviousPatient,
  skipPatient,
  markPatientDone,
  recallPatient,
  removeQueuePatient,
  resetDailyQueue,
} = queueSlice.actions;

export default queueSlice.reducer;
