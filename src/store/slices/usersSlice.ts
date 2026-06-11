import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UserPermissions {
  dashboard: {
    view: boolean;
  };
  patientRegistry: {
    view: boolean;
    registerNewPatient: boolean;
    editPatient: boolean;
  };
  fpe: {
    view: boolean;
    registerNewFPE: boolean;
    edit: boolean;
    uploadDocuments: boolean;
    viewDocuments: boolean;
    downloadDocuments: boolean;
    deleteDocuments: boolean;
    downloadFPEData: boolean;
    viewConsultationRecord: boolean;
    createConsultation: boolean;
    editConsultation: boolean;
    uploadConsultationDocuments: boolean;
    downloadConsultation: boolean;
  };
  inventory: {
    viewInventory: boolean;
    addInventoryItem: boolean;
    editInventory: boolean;
    viewStockMovements: boolean;
  };
  activityLog: {
    view: boolean;
  };
  patientSurveys: {
    view: boolean;
  };
  patientFlowMetrics: {
    view: boolean;
    add: boolean;
    edit: boolean;
  };
  queueManagement: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    departments?: Record<string, boolean>;
  };
  queueActions: {
    canAddPatients: boolean;
    canCallPatients: boolean;
    canEditPatients: boolean;
    canRemovePatients: boolean;
  };
  canModifyQueueVoiceSettings: boolean;
  settings: {
    view: boolean;
    add: boolean;
    edit: boolean;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  department: string;
  role: "Administrator" | "Doctor" | "Nurse" | "Staff";
  status: "Active" | "Inactive";
  permissions: UserPermissions;
  createdAt: string;
  updatedAt: string;
}

interface UsersState {
  users: User[];
  isLoading: boolean;
}

const defaultPermissions: UserPermissions = {
  dashboard: { view: true },
  patientRegistry: {
    view: true,
    registerNewPatient: false,
    editPatient: false,
  },
  fpe: {
    view: true,
    registerNewFPE: false,
    edit: false,
    uploadDocuments: false,
    viewDocuments: false,
    downloadDocuments: false,
    deleteDocuments: false,
    downloadFPEData: false,
    viewConsultationRecord: false,
    createConsultation: false,
    editConsultation: false,
    uploadConsultationDocuments: false,
    downloadConsultation: false,
  },
  inventory: {
    viewInventory: true,
    addInventoryItem: false,
    editInventory: false,
    viewStockMovements: false,
  },
  activityLog: { view: true },
  patientSurveys: { view: true },
  patientFlowMetrics: { view: true, add: false, edit: false },
  queueManagement: {
    view: true,
    create: false,
    edit: false,
    delete: false,
    departments: {
      Medical: false,
      "Obstetrics & Gynecology (OB-Gyne)": false,
      Pediatrics: false,
      "Dental Department": false,
    },
  },
  queueActions: {
    canAddPatients: false,
    canCallPatients: false,
    canEditPatients: false,
    canRemovePatients: false,
  },
  canModifyQueueVoiceSettings: false,
  settings: { view: false, add: false, edit: false },
};

const adminPermissions: UserPermissions = {
  dashboard: { view: true },
  patientRegistry: { view: true, registerNewPatient: true, editPatient: true },
  fpe: {
    view: true,
    registerNewFPE: true,
    edit: true,
    uploadDocuments: true,
    viewDocuments: true,
    downloadDocuments: true,
    deleteDocuments: true,
    downloadFPEData: true,
    viewConsultationRecord: true,
    createConsultation: true,
    editConsultation: true,
    uploadConsultationDocuments: true,
    downloadConsultation: true,
  },
  inventory: {
    viewInventory: true,
    addInventoryItem: true,
    editInventory: true,
    viewStockMovements: true,
  },
  activityLog: { view: true },
  patientSurveys: { view: true },
  patientFlowMetrics: { view: true, add: true, edit: true },
  queueManagement: {
    view: true,
    create: true,
    edit: true,
    delete: true,
    departments: {
      Medical: true,
      "Obstetrics & Gynecology (OB-Gyne)": true,
      Pediatrics: true,
      "Dental Department": true,
    },
  },
  queueActions: {
    canAddPatients: true,
    canCallPatients: true,
    canEditPatients: true,
    canRemovePatients: true,
  },
  canModifyQueueVoiceSettings: true,
  settings: { view: true, add: true, edit: true },
};

const initialState: UsersState = {
  users: [
    {
      id: "USR-001",
      firstName: "Admin",
      lastName: "User",
      email: "admin@ddhospital.gov.ph",
      password: "admin123",
      department: "Administration",
      role: "Administrator",
      status: "Active",
      permissions: adminPermissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  isLoading: false,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<User>) => {
      state.users.unshift(action.payload);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    toggleUserStatus: (state, action: PayloadAction<string>) => {
      const user = state.users.find((u) => u.id === action.payload);
      if (user) {
        user.status = user.status === "Active" ? "Inactive" : "Active";
        user.updatedAt = new Date().toISOString();
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { addUser, updateUser, toggleUserStatus, setLoading } =
  usersSlice.actions;
export default usersSlice.reducer;
export { defaultPermissions, adminPermissions };
