import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  deleteInventoryDocument,
  fetchInventoryDocuments,
  type InventoryDocument,
  uploadInventoryDocuments,
} from "./inventoryDocumentService";

type QueryOptions = Omit<
  UseQueryOptions<any, Error, any, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const inventoryDocumentKeys = {
  all: ["inventoryDocuments"] as const,
  lists: () => [...inventoryDocumentKeys.all, "list"] as const,
  list: (itemId: string) => [...inventoryDocumentKeys.lists(), itemId] as const,
};

export const useInventoryDocumentsQuery = (
  itemId: string,
  options?: QueryOptions,
) => {
  return useQuery({
    queryKey: inventoryDocumentKeys.list(itemId),
    queryFn: () => fetchInventoryDocuments(itemId),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 5,
    enabled: !!itemId,
    ...options,
  });
};

export const useUploadInventoryDocumentsMutation = (
  itemId: string,
  options?: UseMutationOptions<
    InventoryDocument[],
    Error,
    { files: File[]; itemCode?: string }
  >,
) => {
  const queryClient = useQueryClient();

  const handleUploadSuccess: NonNullable<
    UseMutationOptions<
      InventoryDocument[],
      Error,
      { files: File[]; itemCode?: string }
    >["onSuccess"]
  > = (data, variables, onMutateResult, context) => {
    queryClient.setQueryData(
      inventoryDocumentKeys.list(itemId),
      (oldData: InventoryDocument[] | undefined) => [
        ...(oldData || []),
        ...data,
      ],
    );
    queryClient.invalidateQueries({
      queryKey: inventoryDocumentKeys.list(itemId),
      exact: true,
    });
    queryClient.invalidateQueries({
      queryKey: inventoryDocumentKeys.lists(),
      exact: false,
    });

    options?.onSuccess?.(data, variables, onMutateResult, context);
  };

  return useMutation({
    ...options,
    mutationFn: ({ files, itemCode }) =>
      uploadInventoryDocuments(itemId, files, itemCode),
    onSuccess: handleUploadSuccess,
  });
};

export const useDeleteInventoryDocumentMutation = (
  itemId: string,
  options?: UseMutationOptions<void, Error, string>,
) => {
  const queryClient = useQueryClient();

  const handleDeleteSuccess: NonNullable<
    UseMutationOptions<void, Error, string>["onSuccess"]
  > = (_data, documentId, onMutateResult, context) => {
    queryClient.setQueryData(
      inventoryDocumentKeys.list(itemId),
      (oldData: InventoryDocument[] | undefined) =>
        oldData?.filter((doc) => doc.id !== documentId) || [],
    );
    queryClient.invalidateQueries({
      queryKey: inventoryDocumentKeys.list(itemId),
      exact: true,
    });
    queryClient.invalidateQueries({
      queryKey: inventoryDocumentKeys.lists(),
      exact: false,
    });

    options?.onSuccess?.(_data, documentId, onMutateResult, context);
  };

  return useMutation({
    ...options,
    mutationFn: (documentId) => deleteInventoryDocument(itemId, documentId),
    onSuccess: handleDeleteSuccess,
  });
};
