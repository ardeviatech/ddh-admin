import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  fetchConsultations,
  fetchConsultationByNumber,
  fetchConsultationDocuments,
  uploadConsultationDocuments,
  deleteConsultationDocument,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  type FetchConsultationsOptions,
  type ConsultationDocument,
} from "../services/consultationService";
import type { ConsultationRecord } from "../store/slices/consultationSlice";
import { toast } from "sonner";

type QueryOptions = Omit<
  UseQueryOptions<any, Error, any, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

// Query Keys
export const consultationKeys = {
  all: ["consultations"] as const,
  lists: () => [...consultationKeys.all, "list"] as const,
  list: (filters: FetchConsultationsOptions) =>
    [...consultationKeys.lists(), filters] as const,
  details: () => [...consultationKeys.all, "detail"] as const,
  detail: (consultationNumber: string) =>
    [...consultationKeys.details(), consultationNumber] as const,
  documents: () => [...consultationKeys.all, "documents"] as const,
  documentList: (consultationNumber: string) =>
    [...consultationKeys.documents(), consultationNumber] as const,
};

// Queries

export const useConsultationsQuery = (
  filters: FetchConsultationsOptions = {},
  options?: QueryOptions,
) => {
  return useQuery({
    queryKey: consultationKeys.list(filters),
    queryFn: () => fetchConsultations(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (previously cacheTime)
    ...options,
  });
};

export const useConsultationQuery = (
  consultationNumber: string,
  options?: QueryOptions,
) => {
  return useQuery({
    queryKey: consultationKeys.detail(consultationNumber),
    queryFn: () => fetchConsultationByNumber(consultationNumber),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!consultationNumber,
    ...options,
  });
};

export const useConsultationDocumentsQuery = (
  consultationNumber: string,
  options?: QueryOptions,
) => {
  return useQuery({
    queryKey: consultationKeys.documentList(consultationNumber),
    queryFn: () => fetchConsultationDocuments(consultationNumber),
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!consultationNumber,
    ...options,
  });
};

// Mutations

export const useCreateConsultationMutation = (
  options?: UseMutationOptions<
    ConsultationRecord,
    Error,
    Omit<ConsultationRecord, "id" | "createdAt" | "updatedAt">
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConsultation,
    onSuccess: (data) => {
      // Invalidate consultations list to refetch
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });

      // Add to cache if needed
      queryClient.setQueryData(consultationKeys.detail(data.id), data);

      toast.success("Consultation created successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to create consultation";
      toast.error(message);
    },
    ...options,
  });
};

export const useUpdateConsultationMutation = (
  options?: UseMutationOptions<
    ConsultationRecord,
    Error,
    { consultationNumber: string; payload: Partial<ConsultationRecord> }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ consultationNumber, payload }) =>
      updateConsultation(consultationNumber, payload),
    onSuccess: (data, variables) => {
      // Update the specific consultation
      queryClient.setQueryData(
        consultationKeys.detail(variables.consultationNumber),
        data,
      );

      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });

      toast.success("Consultation updated successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update consultation";
      toast.error(message);
    },
    ...options,
  });
};

export const useDeleteConsultationMutation = (
  options?: UseMutationOptions<void, Error, string>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConsultation,
    onSuccess: (_data, consultationNumber) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: consultationKeys.detail(consultationNumber),
      });

      // Invalidate list
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });

      toast.success("Consultation deleted successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete consultation";
      toast.error(message);
    },
    ...options,
  });
};

export const useUploadConsultationDocumentsMutation = (
  consultationNumber: string,
  options?: UseMutationOptions<
    ConsultationDocument[],
    Error,
    { files: File[]; names?: string[]; caseNumber?: string }
  >,
) => {
  const queryClient = useQueryClient();

  const handleUploadSuccess: NonNullable<
    UseMutationOptions<
      ConsultationDocument[],
      Error,
      { files: File[]; names?: string[]; caseNumber?: string }
    >["onSuccess"]
  > = (data, variables, onMutateResult, context) => {
    // Update documents cache
    queryClient.setQueryData(
      consultationKeys.documentList(consultationNumber),
      (oldData: ConsultationDocument[] | undefined) => [
        ...(oldData || []),
        ...data,
      ],
    );

    // Ensure the documents list is refetched and kept in sync
    queryClient.invalidateQueries({
      queryKey: consultationKeys.documentList(consultationNumber),
      exact: true,
    });
    queryClient.invalidateQueries({
      queryKey: consultationKeys.documents(),
      exact: false,
    });

    toast.success(`${data.length} document(s) uploaded successfully`);

    options?.onSuccess?.(data, variables, onMutateResult, context);
  };

  const handleUploadError: NonNullable<
    UseMutationOptions<
      ConsultationDocument[],
      Error,
      { files: File[]; names?: string[]; caseNumber?: string }
    >["onError"]
  > = (error, variables, onMutateResult, context) => {
    const err = error as any;
    const message =
      err?.response?.data?.message || "Failed to upload documents";
    toast.error(message);

    options?.onError?.(error, variables, onMutateResult, context);
  };

  return useMutation({
    ...options,
    mutationFn: ({ files, names, caseNumber }) =>
      uploadConsultationDocuments(consultationNumber, files, names, caseNumber),
    onSuccess: handleUploadSuccess,
    onError: handleUploadError,
  });
};

export const useDeleteConsultationDocumentMutation = (
  consultationNumber: string,
  options?: UseMutationOptions<void, Error, string>,
) => {
  const queryClient = useQueryClient();

  const handleDeleteSuccess: NonNullable<
    UseMutationOptions<void, Error, string>["onSuccess"]
  > = (_data, documentId, onMutateResult, context) => {
    // Update documents cache by filtering out deleted document
    queryClient.setQueryData(
      consultationKeys.documentList(consultationNumber),
      (oldData: ConsultationDocument[] | undefined) =>
        oldData?.filter((doc) => doc.id !== documentId) || [],
    );

    // Ensure the documents list is refetched and kept in sync
    queryClient.invalidateQueries({
      queryKey: consultationKeys.documentList(consultationNumber),
      exact: true,
    });
    queryClient.invalidateQueries({
      queryKey: consultationKeys.documents(),
      exact: false,
    });

    toast.success("Document deleted successfully");

    options?.onSuccess?.(_data, documentId, onMutateResult, context);
  };

  const handleDeleteError: NonNullable<
    UseMutationOptions<void, Error, string>["onError"]
  > = (error, variables, onMutateResult, context) => {
    const err = error as any;
    const message = err?.response?.data?.message || "Failed to delete document";
    toast.error(message);

    options?.onError?.(error, variables, onMutateResult, context);
  };

  return useMutation({
    ...options,
    mutationFn: (documentId) =>
      deleteConsultationDocument(consultationNumber, documentId),
    onSuccess: handleDeleteSuccess,
    onError: handleDeleteError,
  });
};
