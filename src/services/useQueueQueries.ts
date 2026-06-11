import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import * as service from "./queueService";

export const queueKeys = {
  board: () => ["queue", "board"] as const,
  entries: (params?: string) => ["queue", "entries", params ?? "all"] as const,
  entry: (id: string) => ["queue", "entry", id] as const,
};

export const useQueueBoardQuery = (
  options?: UseQueryOptions<service.QueueBoardResponse, Error>,
) => {
  return useQuery<service.QueueBoardResponse, Error>({
    queryKey: queueKeys.board(),
    queryFn: service.fetchQueueBoard,
    staleTime: 5000,
    refetchInterval: false,
    ...options,
  });
};

export const useQueueEntriesQuery = (
  params?: Record<string, any>,
  options?: UseQueryOptions<service.QueueEntry[], Error>,
) => {
  const key = queueKeys.entries(JSON.stringify(params || {}));
  return useQuery<service.QueueEntry[], Error>({
    queryKey: key,
    queryFn: () => service.fetchQueueEntries(params),
    staleTime: 3000,
    ...options,
  });
};

export const useCreateQueueEntryMutation = (
  options?: UseMutationOptions<
    { entry: service.QueueEntry; board: service.QueueBoardResponse },
    Error,
    { department: string; fullName: string; notes?: string }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      department: string;
      fullName: string;
      notes?: string;
    }) => service.createQueueEntry(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queueKeys.board(), data.board);
      queryClient.invalidateQueries({
        queryKey: ["queue", "entries"],
        exact: false,
      });
    },
    ...options,
  });
};

export const useCallNextMutation = (
  options?: UseMutationOptions<
    { board: service.QueueBoardResponse },
    Error,
    string
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (departmentId: string) => service.callNextPatient(departmentId),
    onSuccess: (data) => {
      queryClient.setQueryData(queueKeys.board(), data.board);
      queryClient.invalidateQueries({
        queryKey: ["queue", "entries"],
        exact: false,
      });
    },
    ...options,
  });
};

export const useRecallQueuePatientMutation = (
  options?: UseMutationOptions<{ entry: service.QueueEntry }, Error, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueId: string) => service.recallQueuePatient(queueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.board() });
      queryClient.invalidateQueries({
        queryKey: ["queue", "entries"],
        exact: false,
      });
    },
    ...options,
  });
};

export const useUpdateQueueEntryMutation = (
  options?: UseMutationOptions<
    any,
    Error,
    { id: string; payload: Partial<service.QueueEntry> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<service.QueueEntry>;
    }) => service.updateQueueEntry(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.board() });
      queryClient.invalidateQueries({
        queryKey: ["queue", "entries"],
        exact: false,
      });
    },
    ...options,
  });
};

export const useDeleteQueueEntryMutation = (
  options?: UseMutationOptions<any, Error, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => service.deleteQueueEntry(id),
    onSuccess: (data) => {
      queryClient.setQueryData(queueKeys.board(), data.board);
      queryClient.invalidateQueries({
        queryKey: ["queue", "entries"],
        exact: false,
      });
    },
    ...options,
  });
};

export default {
  useQueueBoardQuery,
  useQueueEntriesQuery,
  useCreateQueueEntryMutation,
  useCallNextMutation,
  useRecallQueuePatientMutation,
  useUpdateQueueEntryMutation,
  useDeleteQueueEntryMutation,
};
