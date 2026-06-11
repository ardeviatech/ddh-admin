import axiosInstance from "../api/axiosInstance";
import type { Patient } from "../store/slices/patientsSlice";

export type CreatePatientPayload = Omit<
  Patient,
  "patientId" | "age" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
> & {
  birthdate: string;
  validIdName?: string;
};

export interface PaginatedPatientsResponse {
  data: Patient[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type FetchPatientsOptions = {
  search?: string;
  page?: number;
  limit?: number;
};

export const fetchPatients = async (
  options: FetchPatientsOptions = {},
): Promise<PaginatedPatientsResponse> => {
  const response = await axiosInstance.get("/patients", {
    params: {
      search: options.search?.trim(),
      page: options.page,
      limit: options.limit,
    },
  });
  return response.data as PaginatedPatientsResponse;
};

export const fetchPatientById = async (patientId: string): Promise<Patient> => {
  const response = await axiosInstance.get(`/patients/${patientId}`);
  return response.data.data as Patient;
};

export const createPatient = async (
  payload: CreatePatientPayload,
): Promise<Patient> => {
  const response = await axiosInstance.post("/patients", payload);
  return response.data.data as Patient;
};

export const updatePatient = async (
  patientId: string,
  payload: Partial<CreatePatientPayload>,
): Promise<Patient> => {
  const response = await axiosInstance.put(`/patients/${patientId}`, payload);
  return response.data.data as Patient;
};
