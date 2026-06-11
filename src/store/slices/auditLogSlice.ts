import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  module: 'PATIENT' | 'FPE' | 'CONSULTATION' | 'INVENTORY' | 'DOCUMENT' | 'SYSTEM' | 'PATIENT_FLOW';
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: string;
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  ipAddress?: string;
}

interface AuditLogState {
  logs: AuditLog[];
}

const initialState: AuditLogState = {
  logs: [],
};

const auditLogSlice = createSlice({
  name: 'auditLog',
  initialState,
  reducers: {
    addAuditLog: (state, action: PayloadAction<Omit<AuditLog, 'id' | 'timestamp'>>) => {
      const newLog: AuditLog = {
        ...action.payload,
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      state.logs.unshift(newLog); // Add to beginning for most recent first

      // Keep only last 1000 logs to prevent memory issues
      if (state.logs.length > 1000) {
        state.logs = state.logs.slice(0, 1000);
      }
    },
    clearAuditLogs: (state) => {
      state.logs = [];
    },
    deleteAuditLog: (state, action: PayloadAction<string>) => {
      state.logs = state.logs.filter((log) => log.id !== action.payload);
    },
  },
});

export const { addAuditLog, clearAuditLogs, deleteAuditLog } = auditLogSlice.actions;
export default auditLogSlice.reducer;
