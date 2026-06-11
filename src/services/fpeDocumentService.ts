import axiosInstance from "../api/axiosInstance";
import type { DocumentFile } from "../store/slices/fpeSlice";

export type FPEDocumentResponse = DocumentFile & {
  originalName?: string;
  uploadedBy?: string;
  downloadUrl?: string;
};

export const fetchFPEDocuments = async (
  caseNumber: string,
): Promise<FPEDocumentResponse[]> => {
  const response = await axiosInstance.get(
    `/fpe/${encodeURIComponent(caseNumber)}/documents`,
  );
  return response.data.data as FPEDocumentResponse[];
};

export const uploadFPEDocuments = async (
  caseNumber: string,
  files: File[],
  names?: string[],
): Promise<FPEDocumentResponse[]> => {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append("files", file);
    if (names && names[index]) {
      formData.append("names", names[index]);
    }
  });

  const response = await axiosInstance.post(
    `/fpe/${encodeURIComponent(caseNumber)}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data as FPEDocumentResponse[];
};

export const deleteFPEDocument = async (
  caseNumber: string,
  documentId: string,
): Promise<{ documentId: string }> => {
  const response = await axiosInstance.delete(
    `/fpe/${encodeURIComponent(caseNumber)}/documents/${encodeURIComponent(documentId)}`,
  );
  return response.data.data as { documentId: string };
};

export const fetchFPEDocument = async (
  caseNumber: string,
  documentId: string,
): Promise<FPEDocumentResponse> => {
  const response = await axiosInstance.get(
    `/fpe/${encodeURIComponent(caseNumber)}/documents/${encodeURIComponent(documentId)}`,
  );
  return response.data.data as FPEDocumentResponse;
};

export const downloadFPEDocument = async (
  caseNumber: string,
  documentId: string,
): Promise<Blob> => {
  const response = await axiosInstance.get(
    `/fpe/${encodeURIComponent(caseNumber)}/documents/${encodeURIComponent(documentId)}/download`,
    { responseType: "blob" },
  );
  return response.data as Blob;
};
