// app/types/enrollment.ts
// Types mirroring the ACTUAL aicebackend enrollments/serializers.py and
// cohorts/serializers.py output.

import type { CourseLevel } from "./course";

// Nested `course` inside EnrollmentSerializer (full CourseSerializer).
export interface EnrollmentCourse {
  id: number;
  slug: string;
  title: string;
  description: string;
  duration_weeks: number;
  level: CourseLevel;
  skills: string[];
  certificate_name: string;
  instructors: { id: number; name: string; title: string; bio: string; profile_image: string | null }[];
  order: number;
  is_active: boolean;
}

export interface CohortMini {
  id: number;
  name: string;
  code: string;
  start_date: string;
  end_date: string | null;
  is_available: boolean;
  available: boolean;
  is_active: boolean;
  enrollment: number;
  enrollment_name: string;
  enrollment_code: string;
  current_week: number;
  progress: number;
}

// EnrollmentSerializer response fields.
export interface Enrollment {
  id: number;
  course: EnrollmentCourse;
  image_url: string | null;
  is_paid: boolean;
  price: string;
  currency: string;
  is_active: boolean;
  is_available: boolean;
  order: number | null;
  created_at: string;
  has_access: boolean;
  is_eligible: boolean;
  status: string;
  last_cohort_enrolled: CohortMini | null;
  cohorts: CohortMini[];
}

// CohortSerializer response fields.
export interface Cohort {
  id: number;
  name: string;
  code: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_available: boolean;
  available: boolean;
  capacity: number;
  remaining_slots: number | null;
  enrollment: number;
  enrollment_name: string;
  enrollment_code: string;
  enrollment_detail: Enrollment;
  current_week: number;
  progress: number;
}

// CohortMembersView returns paginated ProfileSerializer list.
export interface CohortMember {
  user_id: number;
  aice_id: string;
  username: string;
  full_name: string;
  email: string;
  country: string;
  state: string;
  role: string | null;
  role_display: string | null;
  profile_picture: string | null;
  rank: string;
  occupation: string;
}

export interface PaginatedResults<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
