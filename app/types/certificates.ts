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

export interface SignatoryPayload {
  name: string;
  title: string;
  organization?: string;
  order: number;
  is_active: boolean;
}

export interface CertificateCourseSignatory {
  id: number;
  name: string;
  title: string;
  order: number;
}

export interface CertificateCourse {
  id: number;
  title: string;
  slug: string;
  certificate_name: string;
  signatories: CertificateCourseSignatory[];
}

// Body of PUT /api/certificates/courses/{id}/signatories/
export interface SignatoryAssignment {
  id: number;
  order: number;
}

export interface AssignSignatoriesRequest {
  signatories: SignatoryAssignment[];
}