// app/services/http.ts
// Small helpers for sending registry create/update payloads: JSON when there's
// no file, multipart/form-data when a signature image is being uploaded.

import type { InstructorPayload, AdministratorPayload } from "../types/course";

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

export function hasFile(payload: InstructorPayload | AdministratorPayload): boolean {
  return payload.signature_image instanceof File;
}

// JSON variant that strips an empty signature_image so a null/omitted value can
// never wipe the existing image on edit.
export function toJSON(payload: InstructorPayload | AdministratorPayload) {
  const { signature_image, ...rest } = payload;
  void signature_image;
  return rest;
}

export function toFormData(payload: InstructorPayload | AdministratorPayload): FormData {
  const fd = new FormData();
  if (payload.profile_id != null) fd.append("profile_id", String(payload.profile_id));
  if (payload.title != null) fd.append("title", String(payload.title));
  if (payload.signatory_name != null) fd.append("signatory_name", payload.signatory_name);
  if (payload.signature_image instanceof File) {
    fd.append("signature_image", payload.signature_image);
  }
  return fd;
}

export function multipartHeaders() {
  return MULTIPART;
}