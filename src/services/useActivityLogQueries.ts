import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  fetchActivityLogs,
  createActivityLog,
  type ActivityLogEntry,
  type ActivityLogQueryResponse,
  type CreateActivityLogPayload,
} from "./activityLogService";
import { toast } from "sonner";

export const activityLogKeys = {
  all: ["activityLogs"] as const,
  list: (params: Record<string, unknown>) =>
    [...activityLogKeys.all, "list", params] as const,
  detail: (logId: string) => [...activityLogKeys.all, "detail", logId] as const,
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const useActivityLogsQuery = (
  params: {
    search?: string;
    module?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
  },
  options?: QueryOptions<ActivityLogQueryResponse>,
) => {
  return useQuery<
    ActivityLogQueryResponse,
    Error,
    ActivityLogQueryResponse,
    readonly unknown[]
  >({
    queryKey: activityLogKeys.list(params),
    queryFn: () =>
      fetchActivityLogs({
        ...params,
        includeDocumentCount: true,
      }),
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export const useCreateActivityLogMutation = (
  options?: UseMutationOptions<
    ActivityLogEntry,
    Error,
    CreateActivityLogPayload
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createActivityLog,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: activityLogKeys.all });
      toast.success("Activity log persisted successfully");
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error: any, variables, onMutateResult, context) => {
      const err = error as any;
      const message =
        err?.response?.data?.message || "Failed to persist activity log";
      toast.error(message);
      options?.onError?.(error, variables, onMutateResult, context);
    },
    ...options,
  });
};
