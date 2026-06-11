import axiosInstance from "../api/axiosInstance";
import type { InventoryItem } from "../store/slices/inventorySlice";

export type InventoryItemsQueryParams = {
  search?: string;
  category?: string;
  status?: string;
};

export const fetchInventoryItems = async (
  params?: InventoryItemsQueryParams,
): Promise<InventoryItem[]> => {
  const response = await axiosInstance.get("/inventory", { params });
  return response.data.data as InventoryItem[];
};

export const fetchInventoryItem = async (
  itemId: string,
): Promise<InventoryItem> => {
  const response = await axiosInstance.get(`/inventory/${itemId}`);
  return response.data.data as InventoryItem;
};

export const createInventoryItem = async (
  payload: Omit<InventoryItem, "id">,
): Promise<InventoryItem> => {
  const response = await axiosInstance.post("/inventory", payload);
  return response.data.data as InventoryItem;
};

export const updateInventoryItem = async (
  itemId: string,
  payload: Partial<Omit<InventoryItem, "id" | "itemCode">>,
): Promise<InventoryItem> => {
  const response = await axiosInstance.put(`/inventory/${itemId}`, payload);
  return response.data.data as InventoryItem;
};
