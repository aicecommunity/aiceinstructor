// app/types/records.ts
// Types for the students/records + submission-review features. The models these
// mirror live in aicebackend: courses/models.py (CourseCompletion),
// curriculum/models.py (QuizAttempt, PracticalSubmission) and the
// assessment/serializers.py (PracticalSubmissionSerializer). Only the cohort
// aggregate progress endpoint (GET /api/cohorts/{id}/progress/) is genuinely
// readable & instructor-viewable today; everything per-learner here is mocked.

export type PracticalSubmissionStatus =
  | "pending"
  | "approved"
  | "needs_revision"
  | "failed"
  | "completed";

// CourseCompletion (courses/models.py:84).
export interface CourseCompletionSummary {
  is_completed: boolean;
  completed_at: string | null;
}

// QuizAttempt (curriculum/models.py:128) — summarized per assessment.
export interface QuizAttemptSummary {
  assessment_id: number;
  unit_title: string;
  score: number;
  total_questions: number;
  passed: boolean;
  attempted_at: string;
}

export interface GradingRuleResult {
  description: string;
  is_required: boolean;
  passed: boolean;
}

// PracticalQuestion ref used inside a submission (PracticalQuestionSerializer).
export interface PracticalQuestionRef {
  id: number;
  task_title: string;
  practical_type: "github" | "post";
  unit_order: number;
  max_score: number;
  repository: string;
  directory: string;
  file_name: string;
  rules: { description: string; keyword: string; is_required: boolean }[];
}

// Mirrors PracticalSubmissionSerializer fields (assessment/serializers.py:74).
export interface PracticalSubmission {
  id: number;
  profile: number;
  cohort: number;
  cohort_id: number;
  cohort_name: string;
  enrollment: number;
  enrollment_id: number;
  course_slug: string;
  course_title: string;
  question: number;
  question_detail: PracticalQuestionRef;
  github_repo_url: string | null;
  file_url: string | null;
  score: number | null;
  status: PracticalSubmissionStatus;
  feedback: string;
  submitted_at: string;
  ruleResults: GradingRuleResult[];
}

// A learner within a cohort and their aggregate records (completion + quiz +
// practical) — this is what would come from a future instructor-scoped aggregate
// read endpoint. There is none today, so this is mocked.
export interface LearnerIdentity {
  user_id: number;
  aice_id: string;
  full_name: string;
  username: string;
  email: string;
}

export interface LearnerRecord {
  profile: LearnerIdentity;
  completion: CourseCompletionSummary;
  quiz_attempts: QuizAttemptSummary[];
  practical_submissions: PracticalSubmission[];
}

// GET /api/cohorts/{cohort_id}/progress/ (cohorts/views.py:204 CohortProgressView).
export interface CohortProgress {
  cohort_id: number;
  cohort_name: string;
  course_progress: {
    course_id: number;
    course_title: string;
    course_slug: string;
    progress: number;
    current_week: number;
    start_date: string;
    end_date: string | null;
  };
}

// PROPOSED write payload for "instructor override score + feedback". No such
// endpoint exists today (verified) — this is the shape the backend should accept
// when it implements instructor grading override. The UI is a proposal only.
export interface GradingOverridePayload {
  submission_id: number;
  score: number;
  status: PracticalSubmissionStatus;
  feedback: string;
  reason: string;
}
