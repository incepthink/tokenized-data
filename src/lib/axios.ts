import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // https://test.hashcase.co/api
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
      window.location.href = "/examples/tokenized-data/auth";
    }
    return Promise.reject(error);
  },
);
