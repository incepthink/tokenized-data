import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_HASHCASE_DATA_API_URL || "https://test.hashcase.co/api",
});

export const axiosInstanceImage = axios.create({
  baseURL: import.meta.env.VITE_HASHCASE_API_URL || "https://api.hashcase.co",
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (!window.location.pathname.includes("/auth")) {
        window.location.href = "/examples/tokenized-data";
      }
    }
    return Promise.reject(error);
  },
);
