// lib/mock/mockApi.ts
//
// Mock API surface. Mirrors the eventual real service layer in app/services/,
// so stores can swap from mock to real with a one-line change (flip USE_MOCK).
// See lib/mock/README.md for the convention.
//
// The curriculum surface below simulates the read shape of the real backend
// (aicebackend/curriculum/serializers.py) and adds in-memory CRUD that the real
// backend does NOT have yet (its endpoints are read-only as of this writing).

import { coursesData, curriculumSeedData, ProgramCalendarSeed, buildMockLearnerRecords } from "./data";
import type {
  CalendarUnit,
  CalendarUnitContent,
  CalendarUnitContentPayload,
  CalendarUnitPayload,
  ContentType,
  ProgramCalendar,
} from "../../app/types/curriculum";
import type {
  CalendarUnitAssessment,
  AssessmentPayload,
  QuizQuestion,
  QuizQuestionPayload,
  PracticalQuestion,
  PracticalQuestionPayload,
} from "../../app/types/assessment";
import type {
  LearnerRecord,
  PracticalSubmission,
  GradingOverridePayload,
} from "../../app/types/records";

type DbCalendar = ProgramCalendarSeed;

// In-memory mutable store seeded once from the static data.
const db: DbCalendar[] = curriculumSeedData.map((c) => ({
  ...c,
  units: c.units.map((u) => ({
    ...u,
    contents: u.contents.map((x) => ({ ...x })),
  })),
}));

let nextUnitId = db.reduce((m, c) => Math.max(m, ...c.units.map((u) => u.id)), 0) + 1;
let nextContentId =
  db.reduce((m, c) => Math.max(m, ...c.units.map((u) => u.contents.map((x) => x.id)).flat()), 0) + 1;

function toCalendar(seed: DbCalendar): ProgramCalendar {
  return {
    id: seed.id,
    enrollment: seed.enrollment,
    enrollment_title: seed.enrollment_title,
    enrollment_slug: seed.enrollment_slug,
    name: seed.name,
    created_at: seed.created_at,
    units: seed.units.map(toUnit),
  };
}

function toUnit(u: DbCalendar["units"][number]): CalendarUnit {
  return {
    id: u.id,
    title: u.title,
    description: u.description,
    duration_days: u.duration_days,
    order: u.order,
    contents: u.contents.map(toContent),
    assessment: null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toContent(x: any): CalendarUnitContent {
  return {
    id: x.id,
    content_type: x.content_type as ContentType,
    title: x.title,
    url: x.url,
    description: x.description,
    duration_minutes: x.duration_minutes,
    is_required: x.is_required,
    order: x.order,
  };
}

function getOrCreateCalendar(enrollmentId: number): DbCalendar {
  let cal = db.find((c) => c.enrollment === enrollmentId);
  if (!cal) {
    cal = {
      id: db.length ? Math.max(...db.map((c) => c.id)) + 1 : 1,
      enrollment: enrollmentId,
      enrollment_title: `Enrollment #${enrollmentId}`,
      enrollment_slug: `enrollment-${enrollmentId}`,
      name: `Calendar for enrollment ${enrollmentId}`,
      created_at: new Date().toISOString(),
      units: [],
    };
    db.push(cal);
  }
  return cal;
}

const delay = () => new Promise((r) => setTimeout(r, 80));

export const mockApi = {
  courses: {
    list: async () => ({ data: coursesData }),
    get: async (id: number) => ({
      data: coursesData.find((c) => c.id === id) ?? null,
    }),
  },

  curriculum: {
    // GET /api/programs/{enrollment_id}/calendar/  (mirrors ProgramCalendarDetailView)
    getCalendar: async (enrollmentId: number) => {
      await delay();
      return { data: toCalendar(getOrCreateCalendar(enrollmentId)) };
    },

    // POST unit (real backend has no create endpoint yet — simulated)
    createUnit: async (
      enrollmentId: number,
      payload: CalendarUnitPayload
    ): Promise<{ data: CalendarUnit }> => {
      await delay();
      const cal = getOrCreateCalendar(enrollmentId);
      if (cal.units.some((u) => u.order === payload.order)) {
        throw new Error("A unit with this order already exists in this calendar.");
      }
      const unit = {
        id: nextUnitId++,
        title: payload.title,
        description: payload.description,
        duration_days: payload.duration_days,
        order: payload.order,
        contents: [],
      };
      cal.units.push(unit);
      cal.units.sort((a, b) => a.order - b.order);
      return { data: toUnit(unit) };
    },

    // PUT unit
    updateUnit: async (
      enrollmentId: number,
      unitId: number,
      payload: CalendarUnitPayload
    ): Promise<{ data: CalendarUnit }> => {
      await delay();
      const cal = getOrCreateCalendar(enrollmentId);
      const dup = cal.units.find((u) => u.order === payload.order && u.id !== unitId);
      if (dup) {
        throw new Error("A unit with this order already exists in this calendar.");
      }
      const unit = cal.units.find((u) => u.id === unitId);
      if (!unit) throw new Error("Unit not found.");
      unit.title = payload.title;
      unit.description = payload.description;
      unit.duration_days = payload.duration_days;
      unit.order = payload.order;
      cal.units.sort((a, b) => a.order - b.order);
      return { data: toUnit(unit) };
    },

    // DELETE unit
    deleteUnit: async (enrollmentId: number, unitId: number): Promise<void> => {
      await delay();
      const cal = getOrCreateCalendar(enrollmentId);
      cal.units = cal.units.filter((u) => u.id !== unitId);
    },

    // POST content under a unit
    createContent: async (
      enrollmentId: number,
      unitId: number,
      payload: CalendarUnitContentPayload
    ): Promise<{ data: CalendarUnitContent }> => {
      await delay();
      const cal = getOrCreateCalendar(enrollmentId);
      const unit = cal.units.find((u) => u.id === unitId);
      if (!unit) throw new Error("Unit not found.");
      const order = unit.contents.length
        ? Math.max(...unit.contents.map((x) => x.order)) + 1
        : 1;
      const content = {
        id: nextContentId++,
        content_type: payload.content_type,
        title: payload.title,
        url: payload.url,
        description: payload.description,
        duration_minutes: payload.duration_minutes,
        is_required: payload.is_required,
        order,
      };
      unit.contents.push(content);
      unit.contents.sort((a, b) => a.order - b.order);
      return { data: toContent(content) };
    },

    // PUT content
    updateContent: async (
      enrollmentId: number,
      unitId: number,
      contentId: number,
      payload: CalendarUnitContentPayload
    ): Promise<{ data: CalendarUnitContent }> => {
      await delay();
      const cal = getOrCreateCalendar(enrollmentId);
      const unit = cal.units.find((u) => u.id === unitId);
      if (!unit) throw new Error("Unit not found.");
      const content = unit.contents.find((x) => x.id === contentId);
      if (!content) throw new Error("Content not found.");
      Object.assign(content, payload);
      return { data: toContent(content) };
    },

    // DELETE content
    deleteContent: async (
      enrollmentId: number,
      unitId: number,
      contentId: number
    ): Promise<void> => {
      await delay();
      const cal = getOrCreateCalendar(enrollmentId);
      const unit = cal.units.find((u) => u.id === unitId);
      if (!unit) return;
      unit.contents = unit.contents.filter((x) => x.id !== contentId);
    },

    // Reorder a unit's content with up/down controls (swap order with neighbor).
    moveContent: async (
      enrollmentId: number,
      unitId: number,
      contentId: number,
      direction: -1 | 1
    ): Promise<{ data: CalendarUnitContent[] }> => {
      await delay();
      const cal = getOrCreateCalendar(enrollmentId);
      const unit = cal.units.find((u) => u.id === unitId);
      if (!unit) throw new Error("Unit not found.");
      const sorted = [...unit.contents].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((x) => x.id === contentId);
      const swapIdx = idx + direction;
      if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) {
        return { data: unit.contents.sort((a, b) => a.order - b.order).map(toContent) };
      }
      const cur = sorted[idx];
      const other = sorted[swapIdx];
      const tmp = cur.order;
      cur.order = other.order;
      other.order = tmp;
      unit.contents.sort((a, b) => a.order - b.order);
      return { data: unit.contents.map(toContent) };
    },
  },
  assessment: {
    getAssessment: async (unitId: number): Promise<{ data: CalendarUnitAssessment | null }> => {
      const row = assessmentDb[unitId];
      return { data: row?.assessment ? toAssessment(row) : null };
    },
    setAssessment: async (
      unitId: number,
      payload: AssessmentPayload
    ): Promise<{ data: CalendarUnitAssessment }> => {
      const row = ensureAssessmentRow(unitId);
      row.assessment = {
        id: row.assessment?.id ?? ++assessmentDbId,
        assessment_type: payload.assessment_type,
        pass_threshold_percent: payload.pass_threshold_percent,
        max_attempts: payload.max_attempts,
        quiz_question_count: row.quizQuestions.length,
      };
      return { data: toAssessment(row) };
    },
    deleteAssessment: async (unitId: number): Promise<{ data: null }> => {
      delete assessmentDb[unitId];
      return { data: null };
    },
    listQuiz: async (unitId: number): Promise<{ data: QuizQuestion[] }> => {
      const row = assessmentDb[unitId] ?? emptyRow();
      return { data: [...row.quizQuestions].sort((a, b) => a.order - b.order) };
    },
    createQuiz: async (
      unitId: number,
      courseSlug: string,
      unitOrder: number,
      payload: QuizQuestionPayload
    ): Promise<{ data: QuizQuestion }> => {
      const row = ensureAssessmentRow(unitId);
      if (!row.assessment) row.assessment = defaultAssessment();
      const order = row.quizQuestions.length + 1;
      const created: QuizQuestion = {
        id: ++assessmentDbId,
        code: `${courseSlug}_quiz_unit${unitOrder}_${order}`,
        question_text: payload.question_text,
        option_a: payload.option_a,
        option_b: payload.option_b,
        option_c: payload.option_c,
        option_d: payload.option_d,
        correct_answer: payload.correct_answer,
        explanation: payload.explanation,
        order,
      };
      row.quizQuestions.push(created);
      return { data: created };
    },
    updateQuiz: async (
      unitId: number,
      questionId: number,
      payload: QuizQuestionPayload
    ): Promise<{ data: QuizQuestion }> => {
      const existing = getQuiz(unitId, questionId);
      Object.assign(existing, payload);
      return { data: existing };
    },
    deleteQuiz: async (unitId: number, questionId: number): Promise<{ data: null }> => {
      const row = ensureAssessmentRow(unitId);
      row.quizQuestions = row.quizQuestions.filter((x) => x.id !== questionId);
      return { data: null };
    },
    listPractical: async (unitId: number): Promise<{ data: PracticalQuestion[] }> => {
      const row = assessmentDb[unitId] ?? emptyRow();
      return { data: [...row.practicalQuestions].sort((a, b) => a.order - b.order) };
    },
    createPractical: async (
      unitId: number,
      courseSlug: string,
      unitOrder: number,
      enrollmentId: number,
      payload: PracticalQuestionPayload
    ): Promise<{ data: PracticalQuestion }> => {
      const row = ensureAssessmentRow(unitId);
      if (!row.assessment) row.assessment = defaultAssessment();
      const order = row.practicalQuestions.length + 1;
      const created: PracticalQuestion = {
        id: ++assessmentDbId,
        code: `${courseSlug}_prac_unit${unitOrder}_${order}`,
        practical_type: payload.practical_type,
        expected_link_provider: payload.expected_link_provider,
        required_post_title: payload.required_post_title,
        required_post_keywords: [...payload.required_post_keywords],
        required_likes_count: payload.required_likes_count,
        required_comments_count: payload.required_comments_count,
        required_min_words: payload.required_min_words,
        enrollment: enrollmentId,
        assessment: row.assessment!.id,
        unit_order: unitOrder,
        order,
        task_title: payload.task_title,
        task_description: payload.task_description,
        repository: payload.repository || courseSlug,
        directory: payload.directory || `unit-${unitOrder}`,
        file_name: payload.file_name,
        max_score: payload.max_score,
        branch: payload.branch || "main",
        starter_repo_url: payload.starter_repo_url,
        rules: payload.rules.map((r) => ({ ...r })),
        is_active: payload.is_active,
        created_at: new Date().toISOString(),
      };
      row.practicalQuestions.push(created);
      return { data: created };
    },
    updatePractical: async (
      unitId: number,
      questionId: number,
      payload: PracticalQuestionPayload
    ): Promise<{ data: PracticalQuestion }> => {
      const existing = getPractical(unitId, questionId);
      Object.assign(existing, payload, {
        required_post_keywords: [...payload.required_post_keywords],
        rules: payload.rules.map((r) => ({ ...r })),
      });
      return { data: existing };
    },
    deletePractical: async (unitId: number, questionId: number): Promise<{ data: null }> => {
      const row = ensureAssessmentRow(unitId);
      row.practicalQuestions = row.practicalQuestions.filter((x) => x.id !== questionId);
      return { data: null };
    },
  },
  students: {
    // Mock per-learner records for a cohort. There is no instructor-scoped
    // aggregate read endpoint today, so the roster is generated. Only the
    // cohort aggregate `progress` (real) is wired in the service layer.
    listRecords: async (ctx: {
      cohortId: number;
      cohortName: string;
      courseSlug: string;
      courseTitle: string;
    }): Promise<{ data: LearnerRecord[] }> => {
      if (!recordsDb[ctx.cohortId]) {
        recordsDb[ctx.cohortId] = {
          generation: buildMockLearnerRecords(ctx),
        };
      }
      return { data: recordsDb[ctx.cohortId].generation.map((r) => cloneRecord(r)) };
    },
    getSubmission: async (
      cohortId: number,
      submissionId: number
    ): Promise<{ data: PracticalSubmission | null }> => {
      const rec = recordsDb[cohortId]?.generation;
      for (const r of rec ?? []) {
        const found = r.practical_submissions.find((s) => s.id === submissionId);
        if (found) return { data: cloneSubmission(found) };
      }
      return { data: null };
    },
    overrideSubmission: async (
      cohortId: number,
      payload: GradingOverridePayload
    ): Promise<{ data: PracticalSubmission }> => {
      const rec = recordsDb[cohortId]?.generation;
      for (const r of rec ?? []) {
        const found = r.practical_submissions.find((s) => s.id === payload.submission_id);
        if (found) {
          found.score = payload.score;
          found.status = payload.status;
          found.feedback = [found.feedback, `Instructor override: ${payload.feedback}`]
            .filter(Boolean)
            .join("\n")
            .trim();
          return { data: cloneSubmission(found) };
        }
      }
      throw new Error("Submission not found.");
    },
  },
};

// In-memory per-cohort student records so override mutations persist in-session.
interface RecordsRow {
  generation: LearnerRecord[];
}
const recordsDb: Record<number, RecordsRow> = {};

function cloneSubmission(s: PracticalSubmission): PracticalSubmission {
  return {
    ...s,
    ruleResults: s.ruleResults.map((x) => ({ ...x })),
    question_detail: {
      ...s.question_detail,
      rules: s.question_detail.rules.map((x) => ({ ...x })),
    },
  };
}

function cloneRecord(r: LearnerRecord): LearnerRecord {
  return {
    profile: { ...r.profile },
    completion: { ...r.completion },
    quiz_attempts: r.quiz_attempts.map((q) => ({ ...q })),
    practical_submissions: r.practical_submissions.map(cloneSubmission),
  };
}

// Standalone in-memory assessment store, keyed by unit id (number), independent
// of the curriculum seed DB so prompt-05 unit state stays untouched. Uses the
// same convention (mirror real serializer output) as the rest of the mock layer.
interface AssessmentRow {
  assessment: CalendarUnitAssessment | null;
  quizQuestions: QuizQuestion[];
  practicalQuestions: PracticalQuestion[];
}

let assessmentDbId = 900;
const assessmentDb: Record<number, AssessmentRow> = {};

function emptyRow(): AssessmentRow {
  return { assessment: null, quizQuestions: [], practicalQuestions: [] };
}

function ensureAssessmentRow(unitId: number): AssessmentRow {
  assessmentDb[unitId] = assessmentDb[unitId] ?? emptyRow();
  return assessmentDb[unitId];
}

function defaultAssessment(): CalendarUnitAssessment {
  const id = ++assessmentDbId;
  return {
    id,
    assessment_type: "quiz",
    pass_threshold_percent: 60,
    max_attempts: 1,
    quiz_question_count: 0,
  };
}

function toAssessment(row: AssessmentRow): CalendarUnitAssessment {
  return {
    id: row.assessment?.id ?? ++assessmentDbId,
    assessment_type: row.assessment?.assessment_type ?? "quiz",
    pass_threshold_percent: row.assessment?.pass_threshold_percent ?? 60,
    max_attempts: row.assessment?.max_attempts ?? 1,
    quiz_question_count: row.quizQuestions.length,
  };
}

function getQuiz(unitId: number, questionId: number): QuizQuestion {
  const row = ensureAssessmentRow(unitId);
  const existing = row.quizQuestions.find((x) => x.id === questionId);
  if (!existing) throw new Error("Quiz question not found.");
  return existing;
}

function getPractical(unitId: number, questionId: number): PracticalQuestion {
  const row = ensureAssessmentRow(unitId);
  const existing = row.practicalQuestions.find((x) => x.id === questionId);
  if (!existing) throw new Error("Practical question not found.");
  return existing;
}

