import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  fetchPatientFlowDocuments,
  uploadPatientFlowDocuments,
  deletePatientFlowDocument,
  type PatientFlowDocument,
} from "./patientFlowDocumentService";
import { toast } from "sonner";

export const patientFlowDocumentKeys = {
  all: ["patientFlowDocuments"] as const,
  list: (metricId: string) =>
    [...patientFlowDocumentKeys.all, metricId] as const,
  detail: (metricId: string, documentId: string) =>
    [...patientFlowDocumentKeys.all, metricId, documentId] as const,
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const usePatientFlowDocumentsQuery = (
  metricId: string,
  options?: QueryOptions<PatientFlowDocument[]>,
) => {
  return useQuery<PatientFlowDocument[], Error>({
    queryKey: patientFlowDocumentKeys.list(metricId),
    queryFn: () => fetchPatientFlowDocuments(metricId),
    enabled: !!metricId,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export const useUploadPatientFlowDocumentsMutation = (
  options?: UseMutationOptions<
    PatientFlowDocument[],
    Error,
    { metricId: string; formData: FormData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ metricId, formData }) =>
      uploadPatientFlowDocuments(metricId, formData),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: patientFlowDocumentKeys.list(variables.metricId),
      });
      toast.success("Document uploaded successfully");
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error: any, variables, onMutateResult, context) => {
      const message =
        error.response?.data?.message || "Failed to upload documents";
      toast.error(message);
      options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
};

export const useDeletePatientFlowDocumentMutation = (
  options?: UseMutationOptions<
    { documentId: string },
    Error,
    { metricId: string; documentId: string }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ metricId, documentId }) =>
      deletePatientFlowDocument(metricId, documentId),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: patientFlowDocumentKeys.list(variables.metricId),
      });
      toast.success("Document deleted successfully");
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error: any, variables, onMutateResult, context) => {
      const message =
        error.response?.data?.message || "Failed to delete document";
      toast.error(message);
      options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
};
