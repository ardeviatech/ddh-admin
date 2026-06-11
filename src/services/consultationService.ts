import axiosInstance from "../api/axiosInstance";
import type { ConsultationRecord } from "../store/slices/consultationSlice";

export interface PaginatedConsultationResponse {
  data: ConsultationRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ConsultationDocument {
  id: string;
  name: string;
  originalName: string;
  size: string;
  type: string;
  uploadedAt: string;
  uploadedBy?: string;
  downloadUrl: string;
}

export type FetchConsultationsOptions = {
  search?: string;
  page?: number;
  limit?: number;
  caseNumber?: string;
  patientId?: string;
};

export const fetchConsultations = async (
  options: FetchConsultationsOptions = {},
): Promise<PaginatedConsultationResponse> => {
  const response = await axiosInstance.get("/consultations", {
    params: {
      search: options.search?.trim(),
      page: options.page,
      limit: options.limit,
      caseNumber: options.caseNumber?.trim(),
      patientId: options.patientId?.trim(),
    },
  });
  return response.data as PaginatedConsultationResponse;
};

export const fetchConsultationByNumber = async (
  consultationNumber: string,
): Promise<ConsultationRecord> => {
  const response = await axiosInstance.get(
    `/consultations/${consultationNumber}`,
  );
  return response.data.data as ConsultationRecord;
};

export const createConsultation = async (
  payload: Omit<ConsultationRecord, "id" | "createdAt" | "updatedAt">,
): Promise<ConsultationRecord> => {
  const response = await axiosInstance.post("/consultations", payload);
  return response.data.data as ConsultationRecord;
};

export const updateConsultation = async (
  consultationNumber: string,
  payload: Partial<ConsultationRecord>,
): Promise<ConsultationRecord> => {
  const response = await axiosInstance.put(
    `/consultations/${consultationNumber}`,
    payload,
  );
  return response.data.data as ConsultationRecord;
};

export const deleteConsultation = async (
  consultationNumber: string,
): Promise<void> => {
  await axiosInstance.delete(`/consultations/${consultationNumber}`);
};

// Document APIs

export const fetchConsultationDocuments = async (
  consultationNumber: string,
): Promise<ConsultationDocument[]> => {
  const response = await axiosInstance.get(
    `/consultations/${consultationNumber}/documents`,
  );
  return response.data.data as ConsultationDocument[];
};

export const uploadConsultationDocuments = async (
  consultationNumber: string,
  files: File[],
  names?: string[],
  caseNumber?: string,
): Promise<ConsultationDocument[]> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  if (names && names.length > 0) {
    names.forEach((name) => {
      formData.append("names", name);
    });
  }

  if (caseNumber) {
    formData.append("caseNumber", caseNumber);
  }

  const response = await axiosInstance.post(
    `/consultations/${consultationNumber}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data as ConsultationDocument[];
};

export const fetchConsultationDocument = async (
  consultationNumber: string,
  documentId: string,
): Promise<ConsultationDocument> => {
  const response = await axiosInstance.get(
    `/consultations/${consultationNumber}/documents/${documentId}`,
  );
  return response.data.data as ConsultationDocument;
};

export const downloadConsultationDocument = async (
  consultationNumber: string,
  documentId: string,
  filename: string,
): Promise<void> => {
  const response = await axiosInstance.get(
    `/consultations/${consultationNumber}/documents/${documentId}/download`,
    { responseType: "blob" },
  );

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const deleteConsultationDocument = async (
  consultationNumber: string,
  documentId: string,
): Promise<void> => {
  await axiosInstance.delete(
    `/consultations/${consultationNumber}/documents/${documentId}`,
  );
};
