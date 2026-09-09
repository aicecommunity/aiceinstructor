// app/types/curriculum.ts
// Types mirroring the ACTUAL aicebackend/curriculum/serializers.py output.
// These are the shapes a future real backend integration would return, so the
// mock layer matches them exactly (swap = one-line USE_MOCK flip).

export type ContentType = "video" | "pdf" | "link";

// CalendarUnitContentSerializer fields.
export interface CalendarUnitContent {
  id: number;
  content_type: ContentType;
  title: string;
  url: string;
  description: string;
  duration_minutes: number | null;
  is_required: boolean;
  order: number;
}

export interface CalendarUnitContentPayload {
  content_type: ContentType;
  title: string;
  url: string;
  description: string;
  duration_minutes: number | null;
  is_required: boolean;
}

// Assessment placeholder (not built in this prompt) — present in serializer shape.
export interface CalendarUnitAssessment {
  id: number;
  assessment_type: string;
  pass_threshold_percent: number;
  max_attempts: number;
  quiz_question_count: number;
}

// CalendarUnitSerializer fields.
export interface CalendarUnit {
  id: number;
  title: string;
  description: string;
  duration_days: number;
  order: number;
  contents: CalendarUnitContent[];
  assessment: CalendarUnitAssessment | null;
}

export interface CalendarUnitPayload {
  title: string;
  description: string;
  duration_days: number;
  order?: number;
}

// ProgramCalendarSerializer fields.
export interface ProgramCalendar {
  id: number;
  enrollment: number;
  enrollment_title: string;
  enrollment_slug: string;
  name: string;
  created_at: string;
  units: CalendarUnit[];
}
