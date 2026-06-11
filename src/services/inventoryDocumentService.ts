import axiosInstance from "../api/axiosInstance";

export interface InventoryDocument {
  id: string;
  inventoryItemId: string;
  itemCode?: string;
  name: string;
  originalName: string;
  size: string;
  type: string;
  uploadedAt: string;
  uploadedBy?: string;
  downloadUrl: string;
}

export const fetchInventoryDocuments = async (
  itemId: string,
): Promise<InventoryDocument[]> => {
  const response = await axiosInstance.get(`/inventory/${itemId}/documents`);
  return response.data.data as InventoryDocument[];
};

export const uploadInventoryDocuments = async (
  itemId: string,
  files: File[],
  itemCode?: string,
): Promise<InventoryDocument[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (itemCode) {
    formData.append("itemCode", itemCode);
  }

  const response = await axiosInstance.post(
    `/inventory/${itemId}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data as InventoryDocument[];
};

export const deleteInventoryDocument = async (
  itemId: string,
  documentId: string,
): Promise<void> => {
  await axiosInstance.delete(`/inventory/${itemId}/documents/${documentId}`);
};

export const downloadInventoryDocument = async (
  itemId: string,
  documentId: string,
  filename: string,
): Promise<void> => {
  const response = await axiosInstance.get(
    `/inventory/${itemId}/documents/${documentId}/download`,
    { responseType: "blob" },
  );

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
