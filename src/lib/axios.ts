import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // https://test.hashcase.co/api
});

export const axiosInstanceImage = axios.create({
  baseURL: "https://api.hashcase.co", // https://test.hashcase.co/api
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
