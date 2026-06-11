import axiosInstance from "../api/axiosInstance";

export interface PatientFlowDocument {
  id: string;
  name: string;
  originalName: string;
  size: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  downloadUrl: string;
}

export const fetchPatientFlowDocuments = async (
  metricId: string,
): Promise<PatientFlowDocument[]> => {
  const response = await axiosInstance.get(
    `/patient-flow/${metricId}/documents`,
  );
  return response.data.data as PatientFlowDocument[];
};

export const uploadPatientFlowDocuments = async (
  metricId: string,
  formData: FormData,
): Promise<PatientFlowDocument[]> => {
  const response = await axiosInstance.post(
    `/patient-flow/${metricId}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data.data as PatientFlowDocument[];
};

export const deletePatientFlowDocument = async (
  metricId: string,
  documentId: string,
): Promise<{ documentId: string }> => {
  const response = await axiosInstance.delete(
    `/patient-flow/${metricId}/documents/${documentId}`,
  );
  return response.data.data as { documentId: string };
};

export const downloadPatientFlowDocument = async (
  metricId: string,
  documentId: string,
): Promise<Blob> => {
  const response = await axiosInstance.get(
    `/patient-flow/${metricId}/documents/${documentId}/download`,
    { responseType: "blob" },
  );
  return response.data as Blob;
};
