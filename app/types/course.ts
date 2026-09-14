// app/types/course.ts
// Types mirroring the ACTUAL aicebackend/courses/serializers.py output.

export interface Instructor {
  id: number;
  name: string;
  title: string;
  email: string | null;
  profile_image: string | null;
  profile_id: number | null;
  course_count: number;
  signatory_name: string;
  signature_image: string | null;
}

// Candidate returned by the superuser-only registered-user picker
// (GET /api/profiles/instructor-candidates/?q=...).
export interface InstructorCandidate {
  user_id: number;
  full_name: string;
  email: string;
  username: string;
}

// Candidate from the administrator picker (GET /api/profiles/administrator-candidates/?q=...).
// People who are currently instructors are included; `signatory_name` and
// `signature_image` carry over from their instructor entry so the form can
// prefill both when they move here.
export interface AdministratorCandidate extends InstructorCandidate {
  signatory_name?: string | null;
  signature_image?: string | null;
}

export interface CoursePrerequisite {
  id: number;
  prerequisite_course: string;
}

// Profile that created the course. `null` = seeded from the backend, which the
// frontend renders as "created by superuser".
export interface CourseCreator {
  user_id: number;
  full_name: string;
  username: string;
  role: string | null;
}

// A certificate the course awards: a name plus 1–7 skills.
export interface CourseCertificate {
  name: string;
  skills: string[];
}

// Course visibility status (Course.Status on the backend).
// active = shown in the catalog & enrollable; coming_soon = shown but not yet
// open for enrollment; inactive = hidden from the learner catalog.
export type CourseStatus = "active" | "inactive" | "coming_soon";

// Course as returned by CourseSerializer (all response fields).
export interface Course {
  id: number;
  slug: string;
  title: string;
  description: string;
  duration_weeks: number;
  skills: string[];
  certificate_name: string;
  certificates: CourseCertificate[];
  image: string | null;       // Cloudinary URL; null when no image
  image_url: string | null;   // Normalised URL; "" when no image
  group_link: string;         // WhatsApp/Telegram/other social link (may be "")
  instructors: Instructor[];
  prerequisites: CoursePrerequisite[];
  status: CourseStatus;
  created_by: CourseCreator | null;
  created_at: string;
  updated_at: string;
}

// Writable Course fields (ModelSerializer non-read_only).
// NOTE: `instructors` and `prerequisites` are read_only on the serializer, so
// they are NOT part of the payload even though they appear in the response.
export interface CoursePayload {
  slug: string;
  title: string;
  description: string;
  duration_weeks: number;
  certificates: CourseCertificate[];
  status: CourseStatus;
  // Cover image: required at creation (backend enforces it); on edit a File
  // replaces the existing image, while omitting it keeps the current one.
  image?: File | null;
  // Optional social/community link for enrolled students.
  group_link?: string;
  // Pricing is write-only on the API and lands on the auto-created
  // Enrollment (CourseViewSet.perform_create). Only sent on create.
  is_paid?: boolean;
  price?: number;
  currency?: string;
}

// Result of GET /api/courses/slug_available/?slug=...
export interface SlugAvailability {
  slug: string;
  stored: string;
  available: boolean;
  error?: string;
}

// Writable Instructor fields.
// NOTE: `name` is derived from the linked profile's full_name (read-only on the
// backend), so the create/edit payload is `profile_id` (Profile.user_id).
// `title` is no longer captured for instructors (removed from the manager UI).
// `signatory_name` is what appears on course certificates (blank falls back to
// `name` on the backend).
export interface InstructorPayload {
  profile_id: number | null;
  title?: string;
  signatory_name: string;
  // Picked file, sent as multipart. `null`/omitted on edit keeps the existing
  // signature image on the backend.
  signature_image?: File | null;
}

// Administrator registry (a "senior instructor"). Managed by superusers in
// their own nav; carries a title from the title registry and unlocks the
// instructor-app features.
export interface Administrator {
  id: number;
  name: string;
  title: number;       // Primary key of the chosen AdministratorTitle
  title_name: string;  // Human-readable title name
  email: string | null;
  profile_id: number | null;
  course_count: number;
  signatory_name: string;
  signature_image: string | null;
}

export interface AdministratorPayload {
  profile_id: number | null;
  title: number;       // AdministratorTitle PK
  signatory_name: string;
  signature_image?: File | null;
}

// Reusable administrator titles — a small, ordered registry the superuser
// manages independently. Each administrator picks one when they're created.
export interface AdministratorTitle {
  id: number;
  name: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface AdministratorTitlePayload {
  name: string;
  order?: number | null;
}
