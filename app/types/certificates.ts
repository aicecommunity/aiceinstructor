// app/types/certificates.ts — certificate signatories & per-course assignments.

export interface Signatory {
  id: number;
  name: string;
  title: string;
  organization: string;
  order: number;
  is_active: boolean;
  // "instructor" / "administrator" when auto-synced from a registry row
  // (name is that row's signatory_name), otherwise null for manual entries.
  source: "instructor" | "administrator" | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateCourseSignatory {
  id: number;
  name: string;
  title: string;
  order: number;
}

// The certificate layout a course uses (the chosen CertificateTemplate).
export interface CertificateCourseLayout {
  id: number;
  name: string;
  signature_type: CertificateTemplateType;
  image_url: string | null;
}

export interface CertificateCourse {
  id: number;
  title: string;
  slug: string;
  certificate_name: string;
  layout: CertificateCourseLayout | null;
  signatories: CertificateCourseSignatory[];
}

// Body of PUT /api/certificates/courses/{id}/signatories/
export interface SignatoryAssignment {
  id: number;
  order: number;
}

export interface AssignSignatoriesRequest {
  signature_type: CertificateTemplateType;
  signatories: SignatoryAssignment[];
}

// Certificate template images (superuser-managed). Two variants exist.
export type CertificateTemplateType = "2" | "3";

export interface CertificateTemplate {
  id: number;
  name: string;
  signature_type: CertificateTemplateType;
  image_url: string | null;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CertificateTemplatePayload {
  name: string;
  signature_type: CertificateTemplateType;
  is_active: boolean;
  // Picked file, sent as multipart. `null`/omitted on edit keeps the existing image.
  image?: File | null;
}