import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  timeout: 600000,
});
api.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      (error.code === "ECONNABORTED"
        ? "This request took too long. Check your history before trying again."
        : "Cannot reach the study server. Start the FastAPI backend on port 8000.");
    return Promise.reject(new Error(message));
  },
);
export const date = (value) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
export const size = (bytes) =>
  bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
