// app/types/course.ts
// Types mirroring the ACTUAL aicebackend/courses/serializers.py output.

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Instructor {
  id: number;
  name: string;
  title: string;
  bio: string;
  profile_image: string | null;
}

export interface CoursePrerequisite {
  id: number;
  prerequisite_course: string;
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
  instructors: Instructor[];
  prerequisites: CoursePrerequisite[];
  order: number;
  is_active: boolean;
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
  skills: string[];
  certificate_name: string;
  order: number;
  is_active: boolean;
}

// Writable Instructor fields (InstructorSerializer non-read_only).
// NOTE: `profile_image` is a read-only SerializerMethodField (URL), so it is not
// part of the write payload.
export interface InstructorPayload {
  name: string;
  title: string;
  bio: string;
}
