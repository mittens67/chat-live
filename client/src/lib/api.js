import axios from "axios";

const STORAGE_KEY = "userInfo";

/**
 * The app's single HTTP client.
 *
 * Replaces the identical `config = { headers: { Authorization: ... } }` block
 * that was copy-pasted at eleven call sites, and adds the 401 handling that
 * was missing everywhere - an expired token used to surface as a generic
 * "Something went wrong" toast on every screen, forever.
 */
const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const token = raw ? JSON.parse(raw)?.token : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    //A corrupt entry just means no auth header; the request will 401 normally
  }
  return config;
});

/** Registered by the app so a 401 can clear context state, not just storage. */
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

/** Pulls the server's error message out, with a sensible fallback. */
export const errorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;

export default api;
