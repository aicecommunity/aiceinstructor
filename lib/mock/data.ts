// lib/mock/data.ts
//
// Mock data for instructor-app features not yet backed by a real endpoint.
// See lib/mock/README.md for the convention.

export interface Course {
  id: number;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  duration_weeks: number;
  certificate_name: string;
  order: number;
  is_active: boolean;
}

export const coursesData: Course[] = [
  {
    id: 1,
    title: "Software Engineering Fellowship",
    description: "Full-stack software engineering foundations.",
    level: "beginner",
    duration_weeks: 12,
    certificate_name: "Software Engineering Fellowship",
    order: 1,
    is_active: true,
  },
  {
    id: 2,
    title: "AI & Data Science",
    description: "Applied AI and data science fundamentals.",
    level: "intermediate",
    duration_weeks: 16,
    certificate_name: "AI & Data Science Fellowship",
    order: 2,
    is_active: true,
  },
];

// ---------------------------------------------------------------------------
// Curriculum (CalendarUnit / CalendarUnitContent) mock seed.
// Mirrors the shapes in app/types/curriculum.ts (which mirror the real
// aicebackend/curriculum/serializers.py output). Keyed by enrollment id.
// Placed here (not data.ts types for courses) so the mockApi can extend them.
// ---------------------------------------------------------------------------

export interface CalendarUnitContentSeed {
  id: number;
  content_type: "video" | "pdf" | "link";
  title: string;
  url: string;
  description: string;
  duration_minutes: number | null;
  is_required: boolean;
  order: number;
}

export interface CalendarUnitSeed {
  id: number;
  title: string;
  description: string;
  duration_days: number;
  order: number;
  contents: CalendarUnitContentSeed[];
}

export interface ProgramCalendarSeed {
  id: number;
  enrollment: number;
  enrollment_title: string;
  enrollment_slug: string;
  name: string;
  created_at: string;
  units: CalendarUnitSeed[];
}

// A couple of realistic programs so the authoring UI can be demoed without a
// backend. The unit/content shapes follow curriculum/models.py:
//   CalendarUnit:  title, description, duration_days, order — unique (calendar, order)
//   CalendarUnitContent: content_type (video|pdf|link), title, url, description,
//                        duration_minutes, is_required, order
export const curriculumSeedData: ProgramCalendarSeed[] = [
  {
    id: 1,
    enrollment: 1,
    enrollment_title: "Software Engineering Fellowship",
    enrollment_slug: "aice-sef",
    name: "Softy Eng Fellowship Calendar",
    created_at: "2025-01-10T09:00:00Z",
    units: [
      {
        id: 1,
        title: "JavaScript Fundamentals",
        description: "Modern JavaScript: variables, functions, and control flow.",
        duration_days: 7,
        order: 1,
        contents: [
          {
            id: 1,
            content_type: "video",
            title: "Intro to JavaScript",
            url: "https://www.youtube.com/watch?v=xxxxxxxx",
            description: "Overview of the JavaScript language.",
            duration_minutes: 24,
            is_required: true,
            order: 1,
          },
          {
            id: 2,
            content_type: "pdf",
            title: "JS Cheat Sheet",
            url: "https://cdn.aice.example/resources/js-cheatsheet.pdf",
            description: "One-page reference for the unit.",
            duration_minutes: null,
            is_required: false,
            order: 2,
          },
        ],
      },
      {
        id: 2,
        title: "DOM Manipulation",
        description: "Selecting elements, handling events, and updating the page.",
        duration_days: 7,
        order: 2,
        contents: [
          {
            id: 3,
            content_type: "video",
            title: "Working with the DOM",
            url: "https://www.youtube.com/watch?v=yyyyyyyy",
            description: "Selecting and manipulating DOM nodes.",
            duration_minutes: 32,
            is_required: true,
            order: 1,
          },
          {
            id: 4,
            content_type: "link",
            title: "MDN: Document Object Model",
            url: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model",
            description: "Reference reading for the unit.",
            duration_minutes: 45,
            is_required: true,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    enrollment: 2,
    enrollment_title: "AI & Data Science",
    enrollment_slug: "aice-ai",
    name: "AI & Data Science Calendar",
    created_at: "2025-02-01T09:00:00Z",
    units: [
      {
        id: 3,
        title: "Python for Data Science",
        description: "NumPy, pandas, and data wrangling essentials.",
        duration_days: 9,
        order: 1,
        contents: [
          {
            id: 5,
            content_type: "video",
            title: "Getting started with pandas",
            url: "https://www.youtube.com/watch?v=zzzzzzzz",
            description: "Core pandas workflows for tabular data.",
            duration_minutes: 28,
            is_required: true,
            order: 1,
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Students / learner records mock seed (prompt 07).
// The per-learner aggregate data shown on the records screen
// (CourseCompletion, QuizAttempt, PracticalSubmission) has NO instructor-scoped
// read endpoint today — every assessment endpoint is learner-"me"-scoped and the
// real cohort-members endpoint returns empty (its `role="student"` filter never
// matches any Profile.role). Only the cohort aggregate progress endpoint
// (GET /api/cohorts/{cohort_id}/progress/) is genuinely readable, and that is
// wired for real in the service layer. This seed supplies the per-learner rows
// and submission-review payloads the store MUST mock.
// ---------------------------------------------------------------------------

import type {
  LearnerRecord,
  PracticalSubmission,
  PracticalQuestionRef,
  PracticalSubmissionStatus,
} from "../../app/types/records";

export const submissionStatuses: PracticalSubmissionStatus[] = [
  "pending",
  "approved",
  "needs_revision",
  "failed",
  "completed",
];

const NAMES = [
  "Amina Bello", "David Okafor", "Chiamaka Eze", "Samuel Adeyemi",
  "Fatima Sani", "Emeka Nwosu", "Grace Okonkwo", "Ibrahim Musa",
];

// Deterministic pseudo-random so any cohort id gets a stable demo roster.
function mulberry(seed: number): () => number {
  let h = seed >>> 0;
  return () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rule(description: string, keyword: string, is_required: boolean, passed: boolean) {
  return { description, keyword, is_required, passed };
}

function buildSubmission(
  id: number,
  profileId: number,
  cohortId: number,
  cohortName: string,
  courseSlug: string,
  courseTitle: string,
  questionRef: PracticalQuestionRef,
  statusIndex: number
): PracticalSubmission {
  const rand = mulberry(id * 7 + 3);
  const status = submissionStatuses[statusIndex % submissionStatuses.length];
  const score =
    status === "pending" ? null
    : status === "failed" ? Math.floor(rand() * 45)
    : Math.floor(45 + rand() * 55);
  const allPassed = status === "completed";
  const ruleResults = questionRef.rules.map((r) =>
    rule(r.description, r.keyword, r.is_required, allPassed ? true : rand() > 0.35)
  );

  const lines = questionRef.rules.map(
    (r) =>
      `${r.description}: ${ruleResults.find((x) => x.description === r.description)?.passed ? "PASS" : "FAIL"}`
  );

  return {
    id,
    profile: profileId,
    cohort: cohortId,
    cohort_id: cohortId,
    cohort_name: cohortName,
    enrollment: cohortId,
    enrollment_id: cohortId,
    course_slug: courseSlug,
    course_title: courseTitle,
    question: questionRef.id,
    question_detail: questionRef,
    github_repo_url:
      questionRef.practical_type === "github"
        ? `https://github.com/aice/${courseSlug}-submissions`
        : null,
    file_url:
      questionRef.practical_type === "github"
        ? `https://raw.githubusercontent.com/aice/${courseSlug}-submissions/main/${questionRef.directory}/${questionRef.file_name}`
        : null,
    score,
    status,
    feedback: lines.join("\n"),
    submitted_at: `2025-0${(statusIndex % 6) + 1}-14T10:2${statusIndex % 10}:00Z`,
    ruleResults,
  };
}

function questionRef(id: number, unitOrder: number, type: "github" | "post", baseRepo: string): PracticalQuestionRef {
  const githubRules = [
    { description: "Commit message has a `feat:` prefix", keyword: "feat:", is_required: true },
    { description: "Solution file `solution.py` exists", keyword: "solution.py", is_required: true },
    { description: "Includes a README with a summary", keyword: "README", is_required: true },
  ];
  const postRules = [
    { description: "Target keyword present", keyword: baseRepo, is_required: true },
    { description: "Reached required likes", keyword: "likes", is_required: true },
    { description: "Reached word count", keyword: "words", is_required: false },
  ];
  return {
    id,
    task_title: type === "github" ? `Unit ${unitOrder} GitHub practical` : `Unit ${unitOrder} community post`,
    practical_type: type,
    unit_order: unitOrder,
    max_score: 100,
    repository: baseRepo,
    directory: `unit-${unitOrder}`,
    file_name: "solution.py",
    rules: type === "github" ? githubRules : postRules,
  };
}

export function buildMockLearnerRecords(opts: {
  cohortId: number;
  cohortName: string;
  courseSlug: string;
  courseTitle: string;
}): LearnerRecord[] {
  const { cohortId, cohortName, courseSlug, courseTitle } = opts;
  const rand = mulberry(cohortId * 13 + 7);
  const count = 6;
  const records: LearnerRecord[] = [];

  for (let i = 0; i < count; i++) {
    const userId = cohortId * 100 + i;
    const fullName = NAMES[i % NAMES.length];
    const username = `${fullName.split(" ")[0].toLowerCase()}.${i}`;
    const email = `${username}@example.com`;
    const completed = i % 3 !== 0;
    const attemptedAt = `2025-0${(i % 6) + 1}-10T0${i % 9}:00:00Z`;

    const quizAttempts =
      i % 2 === 0
        ? [
            { assessment_id: cohortId * 10 + 1, unit_title: "Unit 1", score: 8, total_questions: 10, passed: true, attempted_at: attemptedAt },
            { assessment_id: cohortId * 10 + 2, unit_title: "Unit 2", score: 7, total_questions: 10, passed: true, attempted_at: attemptedAt },
            { assessment_id: cohortId * 10 + 3, unit_title: "Unit 3", score: i % 4 === 0 ? 5 : 9, total_questions: 10, passed: i % 4 !== 0, attempted_at: attemptedAt },
          ]
        : [
            { assessment_id: cohortId * 10 + 1, unit_title: "Unit 1", score: 6, total_questions: 10, passed: false, attempted_at: attemptedAt },
          ];

    const githubRef = questionRef(cohortId * 20 + 1, 1, "github", courseSlug);
    const postRef = questionRef(cohortId * 20 + 2, 2, "post", courseSlug);

    const practicalSubmissions: PracticalSubmission[] = [
      buildSubmission(cohortId * 30 + i + 1, userId, cohortId, cohortName, courseSlug, courseTitle, githubRef, i),
    ];
    if (i % 2 === 0) {
      practicalSubmissions.push(
        buildSubmission(cohortId * 30 + i + 2, userId, cohortId, cohortName, courseSlug, courseTitle, postRef, i + 2)
      );
    }

    records.push({
      profile: {
        user_id: userId,
        aice_id: `AICE-${String(userId).padStart(4, "0")}`,
        full_name: fullName,
        username,
        email,
      },
      completion: {
        is_completed: completed,
        completed_at: completed ? `2025-0${(i % 6) + 1}-20T12:00:00Z` : null,
      },
      quiz_attempts: quizAttempts,
      practical_submissions: practicalSubmissions,
    });
  }

  void rand;
  return records;
}

