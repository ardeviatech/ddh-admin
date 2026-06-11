// src/hooks/useAuthRefresh.ts
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout, setCredentials } from "../../store/slices/authSlice";
import axiosInstance from "../../api/axiosInstance";
import { useMutation } from "@tanstack/react-query";

export const useAuthRefresh = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, accessToken, user } = useAppSelector(
    (state) => state.auth,
  );

  const mutationLogout = useMutation({
    mutationFn: async () => {
      await axiosInstance.post("/auth/logout");
    },
    onSuccess: () => {
      localStorage.removeItem("authToken");
      dispatch(logout());
    },
    onError: () => {
      localStorage.removeItem("authToken");
      dispatch(logout());
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      dispatch(logout());
      return;
    }

    if (isAuthenticated && user && accessToken === token) {
      return;
    }

    const refreshAccessToken = async () => {
      try {
        const response = await axiosInstance.post("/auth/refresh");
        dispatch(
          setCredentials({
            user: response.data.data.user,
            accessToken: response.data.data.accessToken,
          }),
        );
      } catch {
        mutationLogout.mutate();
      }
    };

    refreshAccessToken();
  }, [dispatch, isAuthenticated, user, accessToken, mutationLogout]);
};
