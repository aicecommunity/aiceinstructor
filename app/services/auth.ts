// app/services/auth.ts

import { api } from "./api";

export const auth = {
  me: () => api.get("/auth/me/"),

  logout: () => api.post("/auth/logout/"),
};
