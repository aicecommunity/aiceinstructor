// app/types/assessment.ts
// Types mirroring the ACTUAL aicebackend/curriculum/models.py + serializers.py
// for CalendarUnitAssessment / QuizQuestion / PracticalQuestion. The mock layer
// matches these shapes so a future real swap is a one-line USE_MOCK flip.

export type AssessmentType = "quiz" | "practical" | "both";

// CalendarUnitAssessmentSerializer fields (curriculum/serializers.py:59).
export interface CalendarUnitAssessment {
  id: number;
  assessment_type: AssessmentType;
  pass_threshold_percent: number;
  max_attempts: number;
  quiz_question_count: number;
}

// Writable assessment subset.
export interface AssessmentPayload {
  assessment_type: AssessmentType;
  pass_threshold_percent: number;
  max_attempts: number;
}

// QuizQuestion — QuizQuestionFullSerializer fields.
export interface QuizQuestion {
  id: number;
  code: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
  order: number;
}

export type QuizAnswer = "A" | "B" | "C" | "D";

export interface QuizQuestionPayload {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: QuizAnswer;
  explanation: string;
}

export type PracticalType = "github" | "post";

export interface PracticalRule {
  description: string;
  keyword: string;
  is_required: boolean;
}

// PracticalQuestionSerializer fields (curriculum/serializers.py:42).
export interface PracticalQuestion {
  id: number;
  code: string;
  practical_type: PracticalType;
  required_post_title: string;
  required_post_keywords: string[];
  required_likes_count: number;
  required_comments_count: number;
  required_min_words: number;
  enrollment: number;
  assessment: number;
  unit_order: number;
  order: number;
  task_title: string;
  task_description: string;
  repository: string;
  directory: string;
  file_name: string;
  max_score: number;
  branch: string;
  starter_repo_url: string;
  rules: PracticalRule[];
  is_active: boolean;
  created_at: string;
}

export interface PracticalQuestionPayload {
  practical_type: PracticalType;
  required_post_title: string;
  required_post_keywords: string[];
  required_likes_count: number;
  required_comments_count: number;
  required_min_words: number;
  unit_order: number;
  order: number;
  task_title: string;
  task_description: string;
  repository: string;
  directory: string;
  file_name: string;
  max_score: number;
  branch: string;
  starter_repo_url: string;
  rules: PracticalRule[];
  is_active: boolean;
}
