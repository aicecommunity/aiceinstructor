// app/services/api.ts

import axios from "axios";
import { DJANGO_URL } from "../utils/MyConstants";

export const api = axios.create({
  baseURL: `${DJANGO_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url?.includes("/auth/me/")) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/logout/")) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("token/refresh")
    ) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${DJANGO_URL}/api/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );

        return api(originalRequest);
      } catch (err) {
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
