// app/services/enrollments.ts

import { api } from "./api";
import type { Enrollment } from "../types/enrollment";

export const enrollments = {
  // GET /api/enrollments/  — active enrollments, no server-side filters.
  list: () => api.get<Enrollment[]>("/enrollments/"),
};
