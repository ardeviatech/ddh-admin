import { useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials, logout } from "../store/slices/authSlice";

export const useAuthRefresh = () => {
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        // Attach token temporarily
        const resp = await axiosInstance.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = resp.data?.data?.user;
        if (user) {
          dispatch(setCredentials({ user: { ...user }, accessToken: token }));
        }
      } catch (err) {
        // if token invalid, clear local storage and dispatch logout
        localStorage.removeItem("authToken");
        dispatch(logout());
      }
    };

    // Only run on mount unless accessToken changes
    if (!accessToken) load();
  }, [dispatch, accessToken]);
};
