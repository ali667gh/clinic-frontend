import axios from "axios";

// اولویت با متغیر محیطی است، اگر نبود به لوکال فال‌بک می‌زند
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:9090/api";

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? "";
    const isLoginRequest = requestUrl.includes("/login");

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // هدایت خودکار کاربر به صفحه نشست منقضی شده (جلوگیری از لوپ ریدایرکت)
      if (window.location.pathname !== "/session-expired") {
        window.location.replace("/session-expired");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
