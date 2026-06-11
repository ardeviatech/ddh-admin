import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "sonner";
import { store, persistor } from "../store/store";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { PatientList } from "./pages/PatientList";
import { PatientRegistration } from "./pages/PatientRegistration";
import { PatientPreview } from "./pages/PatientPreview";
import { PatientSuccess } from "./pages/PatientSuccess";
import { PatientEdit } from "./pages/PatientEdit";
import { PatientEditPreview } from "./pages/PatientEditPreview";
import { PatientEditSuccess } from "./pages/PatientEditSuccess";
import { PatientDetail } from "./pages/PatientDetail";
import { FPEList } from "./pages/FPEList";
import { FPERegistration } from "./pages/FPERegistration";
import { FPEEdit } from "./pages/FPEEdit";
import { FPESuccess } from "./pages/FPESuccess";
import { FPEDetail } from "./pages/FPEDetail";
import { SupportingDocuments } from "./pages/SupportingDocuments";
import { UploadDocuments } from "./pages/UploadDocuments";
import { DocumentPreview } from "./pages/DocumentPreview";
import { ConsultationRecord } from "./pages/ConsultationRecord";
import { NewConsultation } from "./pages/NewConsultation";
import { ConsultationDetail } from "./pages/ConsultationDetail";
import { ConsultationDocuments } from "./pages/ConsultationDocuments";
import { ConsultationEdit } from "./pages/ConsultationEdit";
import { ConsultationSuccess } from "./pages/ConsultationSuccess";
import { Settings } from "./pages/Settings";
import { SettingsProfile } from "./pages/SettingsProfile";
import { SettingsUserManagement } from "./pages/SettingsUserManagement";
import { AddUser } from "./pages/AddUser";
import { EditUser } from "./pages/EditUser";
import { ActivityLog } from "./pages/ActivityLog";
import { InventoryList } from "./pages/InventoryList";
import { InventoryDetail } from "./pages/InventoryDetail";
import { AddInventoryItem } from "./pages/AddInventoryItem";
import { EditInventoryItem } from "./pages/EditInventoryItem";
import { StockUpdate } from "./pages/StockUpdate";
import { StockMovements } from "./pages/StockMovements";
import { SurveyDashboard } from "./pages/SurveyDashboard";
import { SurveyResponses } from "./pages/SurveyResponses";
import { SurveyDetail } from "./pages/SurveyDetail";
import { DepartmentPerformance } from "./pages/DepartmentPerformance";
import { FeedbackReview } from "./pages/FeedbackReview";
import { SurveyReports } from "./pages/SurveyReports";
import { PatientFlowDashboard } from "./pages/PatientFlowDashboard";
import { AddPatientFlowMetrics } from "./pages/AddPatientFlowMetrics";
import { PatientFlowHistory } from "./pages/PatientFlowHistory";
import { EditPatientFlowMetrics } from "./pages/EditPatientFlowMetrics";
import { useAuthRefresh } from "./hooks/useAuthRefresh";
import ProtectAuth from "./components/ProtectAuth";
import { QueueManagement } from "./pages/QueueManagement";
import { AddQueuePatient } from "./pages/AddQueuePatient";
import { EditQueuePatient } from "./pages/EditQueuePatient";
import { QueueVoiceSettings } from "./pages/QueueVoiceSettings";
import { SettingsQueueManagement } from "./pages/SettingsQueueManagement";
import { EditQueuePermissions } from "./pages/EditQueuePermissions";

function AppContent() {
  useAuthRefresh();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectAuth />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="patients/new" element={<PatientRegistration />} />
          <Route path="patients/new/preview" element={<PatientPreview />} />
          <Route path="patients/new/success" element={<PatientSuccess />} />
          <Route
            path="patients/edit/success"
            element={<PatientEditSuccess />}
          />
          <Route path="patients/:patientId" element={<PatientDetail />} />
          <Route path="patients/:patientId/edit" element={<PatientEdit />} />
          <Route
            path="patients/:patientId/edit/preview"
            element={<PatientEditPreview />}
          />
          <Route path="fpe" element={<FPEList />} />
          <Route path="fpe/new" element={<FPERegistration />} />
          <Route path="fpe/new/:step" element={<FPERegistration />} />
          <Route path="fpe/:caseNumber/edit/:step" element={<FPEEdit />} />
          <Route path="fpe/success" element={<FPESuccess />} />
          <Route path="fpe/:caseNumber" element={<FPEDetail />} />
          <Route
            path="fpe/:caseNumber/documents"
            element={<SupportingDocuments />}
          />
          <Route
            path="fpe/:caseNumber/documents/upload"
            element={<UploadDocuments />}
          />
          <Route
            path="fpe/:caseNumber/documents/:documentId/preview"
            element={<DocumentPreview />}
          />
          <Route
            path="fpe/:caseNumber/consultations"
            element={<ConsultationRecord />}
          />
          <Route
            path="fpe/:caseNumber/consultations/new"
            element={<NewConsultation />}
          />
          <Route
            path="fpe/:caseNumber/consultations/new/:step"
            element={<NewConsultation />}
          />
          <Route
            path="fpe/:caseNumber/consultations/success"
            element={<ConsultationSuccess />}
          />
          <Route
            path="fpe/:caseNumber/consultations/:consultationId"
            element={<ConsultationDetail />}
          />
          <Route
            path="fpe/:caseNumber/consultations/:consultationId/documents"
            element={<ConsultationDocuments />}
          />
          <Route
            path="fpe/:caseNumber/consultations/:consultationId/edit/:step"
            element={<ConsultationEdit />}
          />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="inventory/new" element={<AddInventoryItem />} />
          <Route path="inventory/:itemId" element={<InventoryDetail />} />
          <Route
            path="inventory/:itemId/edit"
            element={<EditInventoryItem />}
          />
          <Route
            path="inventory/:itemId/movements"
            element={<StockMovements />}
          />
          <Route path="inventory/:itemId/update" element={<StockUpdate />} />
          <Route path="surveys" element={<SurveyDashboard />} />
          <Route path="surveys/responses" element={<SurveyResponses />} />
          <Route path="surveys/responses/:id" element={<SurveyDetail />} />
          <Route
            path="surveys/department-performance"
            element={<DepartmentPerformance />}
          />
          <Route path="surveys/feedback" element={<FeedbackReview />} />
          <Route path="surveys/reports" element={<SurveyReports />} />
          <Route path="patient-flow" element={<PatientFlowDashboard />} />
          <Route path="patient-flow/new" element={<AddPatientFlowMetrics />} />
          <Route path="patient-flow/history" element={<PatientFlowHistory />} />
          <Route
            path="patient-flow/edit/:id"
            element={<EditPatientFlowMetrics />}
          />

          <Route path="queue" element={<QueueManagement />} />
          <Route path="queue/add" element={<AddQueuePatient />} />
          <Route path="queue/:patientId/edit" element={<EditQueuePatient />} />
          <Route path="queue/settings" element={<QueueVoiceSettings />} />
          <Route path="activity-log" element={<ActivityLog />} />
          <Route path="settings" element={<Settings />}>
            <Route index element={<SettingsProfile />} />
            <Route path="profile" element={<SettingsProfile />} />
            <Route path="users" element={<SettingsUserManagement />} />
            <Route path="queue" element={<SettingsQueueManagement />} />
          </Route>
          <Route path="settings/users/new" element={<AddUser />} />
          <Route path="settings/users/:userId/edit" element={<EditUser />} />
          <Route path="settings/queue/:userId/edit" element={<EditQueuePermissions />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}
