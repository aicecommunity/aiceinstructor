"use client";

import { Badge } from "@/components/ui/badge";
import { useAssessmentStore } from "../../store/useAssessmentStore";

/**
 * Compact per-unit assessment status pill: "QUIZ · 3 quiz · 1 practical" when
 * enabled, "No assessment" dashed otherwise. Reads the live store slice so it
 * stays accurate after edits on either the Units or Assessments screens.
 */
export default function AssessmentStatusBadge({ unitId }: { unitId: number }) {
  const slice = useAssessmentStore((s) => s.byUnit[unitId]);

  if (!slice || slice.isLoading) {
    return <Badge variant="outline">Assessment…</Badge>;
  }

  if (!slice.assessment) {
    return (
      <Badge variant="outline" className="border-dashed text-muted-foreground">
        No assessment
      </Badge>
    );
  }

  const { assessment, quizQuestions, practicalQuestions } = slice;
  const label =
    assessment.assessment_type === "both"
      ? "Quiz + Practical"
      : assessment.assessment_type === "quiz"
        ? "Quiz"
        : "Practical";

  return (
    <Badge
      variant="secondary"
      title={`Pass ≥ ${assessment.pass_threshold_percent}% · ${assessment.max_attempts} attempt(s)`}
    >
      {label} · {quizQuestions.length} quiz · {practicalQuestions.length} practical
    </Badge>
  );
}