import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  fetchActivityLogDocuments,
  uploadActivityLogDocuments,
  deleteActivityLogDocument,
  type ActivityLogDocumentEntry,
} from "./activityLogDocumentService";
import { toast } from "sonner";

export const activityLogDocumentKeys = {
  all: ["activityLogDocuments"] as const,
  list: (logId: string) => [...activityLogDocumentKeys.all, logId] as const,
  detail: (logId: string, documentId: string) =>
    [...activityLogDocumentKeys.all, logId, documentId] as const,
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const useActivityLogDocumentsQuery = (
  logId: string,
  options?: QueryOptions<ActivityLogDocumentEntry[]>,
) => {
  return useQuery<ActivityLogDocumentEntry[], Error>({
    queryKey: activityLogDocumentKeys.list(logId),
    queryFn: () => fetchActivityLogDocuments(logId),
    enabled: !!logId,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export const useUploadActivityLogDocumentsMutation = (
  options?: UseMutationOptions<
    ActivityLogDocumentEntry[],
    Error,
    { logId: string; formData: FormData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ logId, formData }) =>
      uploadActivityLogDocuments(logId, formData),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: activityLogDocumentKeys.list(variables.logId),
      });
      toast.success("Document uploaded successfully");
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error: any, variables, onMutateResult, context) => {
      const err = error as any;
      const message =
        err?.response?.data?.message || "Failed to upload document";
      toast.error(message);
      options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
};

export const useDeleteActivityLogDocumentMutation = (
  options?: UseMutationOptions<
    { documentId: string },
    Error,
    { logId: string; documentId: string }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ logId, documentId }) =>
      deleteActivityLogDocument(logId, documentId),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: activityLogDocumentKeys.list(variables.logId),
      });
      toast.success("Document deleted successfully");
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error: any, variables, onMutateResult, context) => {
      const err = error as any;
      const message =
        err?.response?.data?.message || "Failed to delete document";
      toast.error(message);
      options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
};
