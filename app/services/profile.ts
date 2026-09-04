// app/services/profile.ts

import { api } from "./api";

export const profile = {
  // Get current user's profile (includes role / role_display / role_rank)
  getMe: () => api.get("/profiles/me/"),
};
