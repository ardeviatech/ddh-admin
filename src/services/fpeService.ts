import axiosInstance from "../api/axiosInstance";
import type { FPERecord } from "../store/slices/fpeSlice";

export interface PaginatedFPEResponse {
  data: FPERecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type FetchFPEOptions = {
  search?: string;
  page?: number;
  limit?: number;
  latest?: boolean;
  patientId?: string;
};

export type CreateFPEPayload = Omit<
  FPERecord,
  "caseNumber" | "dateCreated" | "lastUpdated" | "createdBy" | "updatedBy"
>;

export type UpdateFPEPayload = Partial<CreateFPEPayload>;

export const fetchFPEs = async (
  options: FetchFPEOptions = {},
): Promise<PaginatedFPEResponse> => {
  const response = await axiosInstance.get("/fpe", {
    params: {
      search: options.search?.trim(),
      page: options.page,
      limit: options.limit,
      latest: options.latest,
      patientId: options.patientId,
    },
  });
  return response.data as PaginatedFPEResponse;
};

export const fetchFPEByCaseNumber = async (
  caseNumber: string,
): Promise<FPERecord> => {
  const response = await axiosInstance.get(`/fpe/${caseNumber}`);
  return response.data.data as FPERecord;
};

export const createFPE = async (
  payload: CreateFPEPayload,
): Promise<FPERecord> => {
  const response = await axiosInstance.post("/fpe", payload);
  return response.data.data as FPERecord;
};

export const updateFPE = async (
  caseNumber: string,
  payload: UpdateFPEPayload,
): Promise<FPERecord> => {
  const response = await axiosInstance.put(`/fpe/${caseNumber}`, payload);
  return response.data.data as FPERecord;
};
