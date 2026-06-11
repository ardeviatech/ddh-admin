import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  fetchPatientFlowMetrics,
  fetchPatientFlowMetric,
  createPatientFlowMetric,
  updatePatientFlowMetric,
  deletePatientFlowMetric,
  type NewPatientFlowMetric,
  type PatientFlowFilters,
} from "./patientFlowService";
import type { PatientFlowMetrics } from "../store/slices/patientFlowSlice";
import { toast } from "sonner";

export const patientFlowKeys = {
  all: ["patientFlow"] as const,
  lists: () => [...patientFlowKeys.all, "list"] as const,
  list: (search?: string, startDate?: string, endDate?: string) =>
    [
      ...patientFlowKeys.all,
      "list",
      search ?? "",
      startDate ?? "",
      endDate ?? "",
    ] as const,
  details: () => [...patientFlowKeys.all, "detail"] as const,
  detail: (metricId: string) =>
    [...patientFlowKeys.details(), metricId] as const,
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const usePatientFlowMetricsQuery = (
  filters?: PatientFlowFilters,
  options?: QueryOptions<PatientFlowMetrics[]>,
) => {
  return useQuery<PatientFlowMetrics[], Error, PatientFlowMetrics[]>({
    queryKey: patientFlowKeys.list(
      filters?.search,
      filters?.startDate,
      filters?.endDate,
    ),
    queryFn: () => fetchPatientFlowMetrics(filters),
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export const usePatientFlowMetricQuery = (
  metricId: string,
  options?: QueryOptions<PatientFlowMetrics>,
) => {
  return useQuery<PatientFlowMetrics, Error>({
    queryKey: patientFlowKeys.detail(metricId),
    queryFn: () => fetchPatientFlowMetric(metricId),
    enabled: !!metricId,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export const useCreatePatientFlowMetricMutation = (
  options?: UseMutationOptions<PatientFlowMetrics, Error, NewPatientFlowMetric>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPatientFlowMetric,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: patientFlowKeys.lists() });
      toast.success("Patient flow metric saved successfully");
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error: any, variables, onMutateResult, context) => {
      const message =
        error.response?.data?.message || "Failed to save patient flow metric";
      toast.error(message);
      options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
};

export const useUpdatePatientFlowMetricMutation = (
  options?: UseMutationOptions<
    PatientFlowMetrics,
    Error,
    { metricId: string; payload: Partial<NewPatientFlowMetric> }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ metricId, payload }) =>
      updatePatientFlowMetric(metricId, payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: patientFlowKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: patientFlowKeys.detail(variables.metricId),
      });
      toast.success("Patient flow metric updated successfully");
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error: any, variables, onMutateResult, context) => {
      const message =
        error.response?.data?.message || "Failed to update patient flow metric";
      toast.error(message);
      options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
};

export const useDeletePatientFlowMetricMutation = (
  options?: UseMutationOptions<{ id: string }, Error, string>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePatientFlowMetric,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: patientFlowKeys.lists() });
      queryClient.removeQueries({
        queryKey: patientFlowKeys.detail(variables),
      });
      toast.success("Patient flow metric deleted successfully");
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error: any, variables, onMutateResult, context) => {
      const message =
        error.response?.data?.message || "Failed to delete patient flow metric";
      toast.error(message);
      options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
};
