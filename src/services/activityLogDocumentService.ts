import axiosInstance from "../api/axiosInstance";

export interface ActivityLogDocumentEntry {
  id: string;
  name: string;
  originalName: string;
  size: string;
  type: string;
  uploadedAt: string;
  uploadedBy?: string;
  downloadUrl: string;
}

export const fetchActivityLogDocuments = async (
  logId: string,
): Promise<ActivityLogDocumentEntry[]> => {
  const response = await axiosInstance.get(
    `/activity-log/${encodeURIComponent(logId)}/documents`,
  );
  return response.data.data as ActivityLogDocumentEntry[];
};

export const uploadActivityLogDocuments = async (
  logId: string,
  formData: FormData,
): Promise<ActivityLogDocumentEntry[]> => {
  const response = await axiosInstance.post(
    `/activity-log/${encodeURIComponent(logId)}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data.data as ActivityLogDocumentEntry[];
};

export const deleteActivityLogDocument = async (
  logId: string,
  documentId: string,
): Promise<{ documentId: string }> => {
  const response = await axiosInstance.delete(
    `/activity-log/${encodeURIComponent(logId)}/documents/${encodeURIComponent(documentId)}`,
  );
  return response.data.data as { documentId: string };
};

export const downloadActivityLogDocument = async (
  logId: string,
  documentId: string,
): Promise<Blob> => {
  const response = await axiosInstance.get(
    `/activity-log/${encodeURIComponent(logId)}/documents/${encodeURIComponent(documentId)}/download`,
    { responseType: "blob" },
  );
  return response.data as Blob;
};
