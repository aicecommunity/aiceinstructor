// app/types/course.ts
// Types mirroring the ACTUAL aicebackend/courses/serializers.py output.

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Instructor {
  id: number;
  name: string;
  title: string;
  email: string | null;
  profile_image: string | null;
  profile_id: number | null;
  course_count: number;
}

// Candidate returned by the superuser-only registered-user picker
// (GET /api/profiles/instructor-candidates/?q=...).
export interface InstructorCandidate {
  user_id: number;
  full_name: string;
  email: string;
  username: string;
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

// Course as returned by CourseSerializer (all response fields).
export interface Course {
  id: number;
  slug: string;
  title: string;
  description: string;
  duration_weeks: number;
  level: CourseLevel;
  skills: string[];
  certificate_name: string;
  certificates: CourseCertificate[];
  instructors: Instructor[];
  prerequisites: CoursePrerequisite[];
  order: number;
  is_active: boolean;
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
  level: CourseLevel;
  certificates: CourseCertificate[];
  order: number;
  is_active: boolean;
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
export interface InstructorPayload {
  profile_id: number | null;
  title: string;
}
