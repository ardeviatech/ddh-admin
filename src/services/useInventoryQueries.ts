import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  fetchInventoryItems,
  fetchInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  type InventoryItemsQueryParams,
} from "./inventoryService";
import type { InventoryItem } from "../store/slices/inventorySlice";
import { toast } from "sonner";

export const inventoryKeys = {
  all: ["inventory"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  list: () => [...inventoryKeys.lists(), "items"] as const,
  filteredList: (search?: string, category?: string, status?: string) =>
    [
      ...inventoryKeys.all,
      "list",
      search ?? "",
      category ?? "",
      status ?? "",
    ] as const,
  details: () => [...inventoryKeys.all, "detail"] as const,
  detail: (itemId: string) => [...inventoryKeys.details(), itemId] as const,
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const useInventoryItemsQuery = (
  filters?: InventoryItemsQueryParams,
  options?: QueryOptions<InventoryItem[]>,
) => {
  return useQuery<InventoryItem[], Error, InventoryItem[]>({
    queryKey: inventoryKeys.filteredList(
      filters?.search,
      filters?.category,
      filters?.status,
    ),
    queryFn: () => fetchInventoryItems(filters),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    ...options,
  });
};

export const useInventoryItemQuery = (
  itemId: string,
  options?: QueryOptions<InventoryItem>,
) => {
  return useQuery<InventoryItem>({
    queryKey: inventoryKeys.detail(itemId),
    queryFn: () => fetchInventoryItem(itemId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!itemId,
    ...options,
  });
};

export const useCreateInventoryItemMutation = (
  options?: UseMutationOptions<InventoryItem, Error, Omit<InventoryItem, "id">>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list() });
      queryClient.setQueryData(inventoryKeys.detail(data.id), data);
      toast.success("Inventory item created successfully");
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error: any, variables, onMutateResult, context) => {
      const message =
        error.response?.data?.message || "Failed to create inventory item";
      toast.error(message);
      options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
};

export const useUpdateInventoryItemMutation = (
  options?: UseMutationOptions<
    InventoryItem,
    Error,
    { itemId: string; payload: Partial<Omit<InventoryItem, "id" | "itemCode">> }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }) => updateInventoryItem(itemId, payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list() });
      queryClient.setQueryData(inventoryKeys.detail(variables.itemId), data);
      toast.success("Inventory item updated successfully");
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error: any, variables, onMutateResult, context) => {
      const message =
        error.response?.data?.message || "Failed to update inventory item";
      toast.error(message);
      options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
};
