"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Power, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssessmentStore } from "../../store/useAssessmentStore";
import type { AssessmentPayload } from "../../types/assessment";
import type { CalendarUnit } from "../../types/curriculum";
import QuizSection from "./QuizSection";
import PracticalSection from "./PracticalSection";

const EMPTY = {
  assessment: null as import("../../types/assessment").CalendarUnitAssessment | null,
  quizQuestions: [] as import("../../types/assessment").QuizQuestion[],
  practicalQuestions: [] as import("../../types/assessment").PracticalQuestion[],
};

interface Props {
  enrollmentId: number;
  courseSlug: string;
  unit: CalendarUnit;
}

export default function AssessmentPanel({ enrollmentId, courseSlug, unit }: Props) {
  const store = useAssessmentStore();
  const byUnit = store.byUnit;
  const slice = byUnit[unit.id] ?? EMPTY;

  const [showForm, setShowForm] = useState(false);
  const [editForm, setEditForm] = useState(() => buildForm(slice.assessment));
  const [confirmingDisable, setConfirmingDisable] = useState(false);

  useEffect(() => {
    store.loadAssessment(unit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id]);

  const type = slice.assessment?.assessment_type ?? null;

  const openForm = () => {
    setEditForm(buildForm(store.byUnit[unit.id]?.assessment ?? slice.assessment));
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.assessment_type) {
      toast.error("Please select an assessment type.");
      return;
    }
    const payload: AssessmentPayload = {
      assessment_type: editForm.assessment_type as AssessmentPayload["assessment_type"],
      pass_threshold_percent: Number(editForm.pass_threshold_percent),
      max_attempts: Number(editForm.max_attempts),
    };
    const ok = await store.setAssessment(unit, payload);
    if (ok) {
      toast.success("Assessment saved");
      setShowForm(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm("Disable assessment for this unit? Its questions will be removed locally.")) return;
    setConfirmingDisable(true);
    await store.removeAssessment(unit);
    setConfirmingDisable(false);
    setShowForm(false);
    toast.success("Assessment disabled");
  };

  return (
    <div className="mt-4 rounded-md border bg-background">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="size-4" />
          Assessment
          {slice.assessment && (
            <Badge variant="outline">
              {slice.assessment.assessment_type} · {slice.assessment.quiz_question_count} quiz ·{" "}
              {slice.practicalQuestions.length} practical
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {slice.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading assessment…</p>
        ) : slice.error ? (
          <p className="text-sm text-red-600">{slice.error}</p>
        ) : (
          <>
            {slice.assessment == null ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  No assessment configured for this unit.
                </p>
                <Button size="sm" variant="outline" onClick={openForm}>
                  <Power className="size-4" /> Enable assessment
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {slice.assessment.assessment_type.toUpperCase()}
                  </span>{" "}
                  · pass ≥ {slice.assessment.pass_threshold_percent}% ·{" "}
                  {slice.assessment.max_attempts} attempt(s)
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={openForm}>
                    Edit settings
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDisable}
                    disabled={confirmingDisable}
                  >
                    Disable
                  </Button>
                </div>
              </div>
            )}

            {slice.assessmentSaveError && (
              <p className="text-sm text-red-600">{slice.assessmentSaveError}</p>
            )}

            {showForm && (
              <form onSubmit={handleSave} className="grid gap-4 rounded-md border bg-muted/20 p-4">
                <div className="grid gap-2">
                  <Label>Assessment type *</Label>
                  <Select
                    value={editForm.assessment_type}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, assessment_type: v as AssessmentPayload["assessment_type"] }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an assessment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz">Quiz only</SelectItem>
                      <SelectItem value="practical">Practical only</SelectItem>
                      <SelectItem value="both">Quiz + Practical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Pass threshold (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={editForm.pass_threshold_percent}
                      onChange={(e) => setEditForm((f) => ({ ...f, pass_threshold_percent: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Max attempts</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editForm.max_attempts}
                      onChange={(e) => setEditForm((f) => ({ ...f, max_attempts: e.target.value }))}
                    />
                  </div>
                </div>
                {slice.assessment && Number(editForm.max_attempts) > 1 && (
                  <p className="text-xs text-amber-600">
                    Note: max_attempts &gt; 1 is inconsistent with the backend
                    QuizAttempt unique(profile, assessment) constraint (report 01 gotcha #3).
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={slice.isSavingAssessment}>
                    {slice.isSavingAssessment ? "Saving…" : "Save"}
                  </Button>
                </div>
              </form>
            )}

            {(type === "quiz" || type === "both") && (
              <QuizSection courseSlug={courseSlug} unit={unit} />
            )}
            {(type === "practical" || type === "both") && (
              <PracticalSection enrollmentId={enrollmentId} courseSlug={courseSlug} unit={unit} />
            )}
            {type == null && (
              <p className="text-xs text-muted-foreground">
                Enable an assessment to author quiz and practical questions.
              </p>
            )}
          </>
        )}
      </CardContent>
    </div>
  );
}

function buildForm(assessment: import("../../types/assessment").CalendarUnitAssessment | null) {
  return {
    assessment_type: (assessment?.assessment_type ?? "") as AssessmentPayload["assessment_type"] | "",
    pass_threshold_percent: String(assessment?.pass_threshold_percent ?? 60),
    max_attempts: String(assessment?.max_attempts ?? 1),
  };
}
