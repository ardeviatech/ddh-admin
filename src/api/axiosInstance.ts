// api/axiosInstance.ts
import axios from "axios";
import { store } from "../store/store";
import { logout } from "../store/slices/authSlice";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.1.16:5000/api";
//  "http://localhost:2000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
});

// -------------------- Request Interceptor --------------------
// Example: attach auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken"); // or from Redux
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// -------------------- Response Interceptor --------------------
// Example: handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";
    const isAuthRequest =
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/login");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      const token = localStorage.getItem("authToken");
      if (!token) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken = refreshResponse.data.data.accessToken;
        localStorage.setItem("authToken", newToken);
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
