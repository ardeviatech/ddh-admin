import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUsers,
  fetchUserById,
  createUser,
  updateUser,
  type UserBrief,
} from "./userService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials } from "../store/slices/authSlice";

export const userKeys = {
  lists: () => ["users"] as const,
  details: (id: string) => ["users", id] as const,
};

export const useUsersQuery = () => {
  return useQuery<UserBrief[]>({
    queryKey: userKeys.lists(),
    queryFn: fetchUsers,
    staleTime: 10000,
    refetchOnWindowFocus: false,
  });
};

export const useUserQuery = (id?: string) => {
  return useQuery<UserBrief>({
    queryKey: id ? userKeys.details(id) : (["users", "unknown"] as const),
    queryFn: () => fetchUserById(id as string),
    enabled: Boolean(id),
    staleTime: 10000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateUserMutation = () => {
  const qc = useQueryClient();
  return useMutation<any, any, Parameters<typeof createUser>[0]>({
    mutationFn: (payload) => createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.lists() }),
  });
};

export const useUpdateUserMutation = () => {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);

  return useMutation<
    any,
    any,
    { id: string; payload: Parameters<typeof updateUser>[1] }
  >({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      const updated = data as any;
      if (updated?.id) {
        qc.invalidateQueries({ queryKey: userKeys.details(updated.id) });
      }
      try {
        if (auth?.user && updated?.id && auth.user.id === updated.id) {
          dispatch(
            setCredentials({
              user: updated as any,
              accessToken: auth.accessToken || "",
            }),
          );
        }
      } catch (e) {
        // ignore
      }
    },
  });
};

export default { useUsersQuery, useCreateUserMutation, useUpdateUserMutation };
