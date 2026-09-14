// app/services/curriculum.ts
// Real backend authoring endpoints for CalendarUnit / CalendarUnitContent.

import { api } from "./api";
import type {
  CalendarUnit,
  CalendarUnitContent,
  CalendarUnitContentPayload,
  CalendarUnitPayload,
  ProgramCalendar,
} from "../types/curriculum";

export const curriculum = {
  // GET /api/programs/{enrollment_id}/calendar/
  getCalendar: (enrollmentId: number) =>
    api.get<ProgramCalendar>(`/programs/${enrollmentId}/calendar/`),

  // POST /api/programs/{enrollment_id}/units/
  createUnit: (enrollmentId: number, payload: CalendarUnitPayload) =>
    api.post<CalendarUnit>(`/programs/${enrollmentId}/units/`, payload),

  // PUT /api/programs/units/{unit_id}/
  updateUnit: (unitId: number, payload: CalendarUnitPayload) =>
    api.put<CalendarUnit>(`/programs/units/${unitId}/`, payload),

  // DELETE /api/programs/units/{unit_id}/
  deleteUnit: (unitId: number) => api.delete(`/programs/units/${unitId}/`),

  // POST /api/programs/units/{unit_id}/content/
  createContent: (unitId: number, payload: CalendarUnitContentPayload) =>
    api.post<CalendarUnitContent>(`/programs/units/${unitId}/content/`, payload),

  // PUT /api/programs/units/{unit_id}/content/{content_id}/
  updateContent: (unitId: number, contentId: number, payload: CalendarUnitContentPayload) =>
    api.put<CalendarUnitContent>(`/programs/units/${unitId}/content/${contentId}/`, payload),

  // DELETE /api/programs/units/{unit_id}/content/{content_id}/
  deleteContent: (unitId: number, contentId: number) =>
    api.delete(`/programs/units/${unitId}/content/${contentId}/`),

  // POST /api/programs/units/{unit_id}/content/upload-pdf/ (multipart)
  uploadPDF: (unitId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ url: string; public_id: string }>(
      `/programs/units/${unitId}/content/upload-pdf/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  // POST /api/programs/units/{unit_id}/content/{content_id}/move/
  moveContent: (unitId: number, contentId: number, direction: -1 | 1) =>
    api.post<CalendarUnitContent[]>(
      `/programs/units/${unitId}/content/${contentId}/move/`,
      { direction }
    ),
};
