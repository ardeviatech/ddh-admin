import axiosInstance from "../api/axiosInstance";
import type { PatientFlowMetrics } from "../store/slices/patientFlowSlice";

export type PatientFlowFilters = {
  search?: string;
  startDate?: string;
  endDate?: string;
};

export type NewPatientFlowMetric = Omit<
  PatientFlowMetrics,
  "id" | "enteredBy" | "createdAt"
>;

export const fetchPatientFlowMetrics = async (
  params?: PatientFlowFilters,
): Promise<PatientFlowMetrics[]> => {
  const response = await axiosInstance.get("/patient-flow", {
    params,
  });
  return response.data.data as PatientFlowMetrics[];
};

export const fetchPatientFlowMetric = async (
  metricId: string,
): Promise<PatientFlowMetrics> => {
  const response = await axiosInstance.get(`/patient-flow/${metricId}`);
  return response.data.data as PatientFlowMetrics;
};

export const createPatientFlowMetric = async (
  payload: NewPatientFlowMetric,
): Promise<PatientFlowMetrics> => {
  const response = await axiosInstance.post("/patient-flow", payload);
  return response.data.data as PatientFlowMetrics;
};

export const updatePatientFlowMetric = async (
  metricId: string,
  payload: Partial<NewPatientFlowMetric>,
): Promise<PatientFlowMetrics> => {
  const response = await axiosInstance.put(
    `/patient-flow/${metricId}`,
    payload,
  );
  return response.data.data as PatientFlowMetrics;
};

export const deletePatientFlowMetric = async (
  metricId: string,
): Promise<{ id: string }> => {
  const response = await axiosInstance.delete(`/patient-flow/${metricId}`);
  return response.data.data as { id: string };
};
