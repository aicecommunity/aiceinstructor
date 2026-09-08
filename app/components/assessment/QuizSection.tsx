"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssessmentStore } from "../../store/useAssessmentStore";
import type { CalendarUnit } from "../../types/curriculum";
import type { QuizAnswer, QuizQuestion, QuizQuestionPayload } from "../../types/assessment";

interface Props {
  courseSlug: string;
  unit: CalendarUnit;
}

export default function QuizSection({ courseSlug, unit }: Props) {
  const store = useAssessmentStore();
  const slice = store.byUnit[unit.id];
  const quiz = slice?.quizQuestions ?? [];
  const [dialog, setDialog] = useState<{ open: boolean; question: QuizQuestion | null }>({
    open: false,
    question: null,
  });

  const openCreate = () => setDialog({ open: true, question: null });
  const openEdit = (q: QuizQuestion) => setDialog({ open: true, question: q });
  const close = () => setDialog((d) => ({ ...d, open: false }));

  const handleDelete = async (q: QuizQuestion) => {
    if (!confirm(`Delete quiz question #${q.order}?`)) return;
    await store.deleteQuiz(unit, q.id);
    toast.success("Quiz question deleted");
  };

  const nextCode = `${courseSlug}_quiz_unit${unit.order}_${quiz.length + 1}`;

  return (
    <div className="rounded-md border bg-muted/10">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Quiz questions</span>
        <Button size="sm" variant="outline" onClick={openCreate} disabled={store.byUnit[unit.id]?.isSavingQuiz}>
          <Plus className="size-4" /> Add question
        </Button>
      </div>

      {quiz.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">
          No quiz questions yet. Add the first one.
        </p>
      ) : (
        <ul className="divide-y">
          {quiz.map((q) => (
            <li key={q.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Q{q.order}</Badge>
                  <span className="truncate text-sm font-medium">{q.question_text}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  A: {q.option_a} · B: {q.option_b}
                  {q.option_c ? ` · C: ${q.option_c}` : ""}
                  {q.option_d ? ` · D: ${q.option_d}` : ""}
                </p>
                <p className="mt-1 text-xs">
                  <span className="text-muted-foreground">Correct:</span>{" "}
                  <Badge variant="secondary">{q.correct_answer}</Badge> ·{" "}
                  <code className="text-muted-foreground">{q.code}</code>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(q)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <QuizQuestionDialog
        key={dialog.question?.id ?? "new"}
        open={dialog.open}
        onOpenChange={close}
        courseSlug={courseSlug}
        nextCode={nextCode}
        unit={unit}
        question={dialog.question}
      />
    </div>
  );
}

function QuizQuestionDialog({
  open,
  onOpenChange,
  courseSlug,
  nextCode,
  unit,
  question,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseSlug: string;
  nextCode: string;
  unit: CalendarUnit;
  question: QuizQuestion | null;
}) {
  const store = useAssessmentStore();
  const slice = store.byUnit[unit.id];
  const isSaving = slice?.isSavingQuiz ?? false;
  const isEdit = Boolean(question);

  const [form, setForm] = useState(() => ({
    question_text: question?.question_text ?? "",
    option_a: question?.option_a ?? "",
    option_b: question?.option_b ?? "",
    option_c: question?.option_c ?? "",
    option_d: question?.option_d ?? "",
    correct_answer: (question?.correct_answer ?? "") as QuizAnswer | "",
    explanation: question?.explanation ?? "",
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.correct_answer) {
      toast.error("Please select the correct answer.");
      return;
    }
    const payload: QuizQuestionPayload = {
      question_text: form.question_text.trim(),
      option_a: form.option_a.trim(),
      option_b: form.option_b.trim(),
      option_c: form.option_c.trim(),
      option_d: form.option_d.trim(),
      correct_answer: form.correct_answer,
      explanation: form.explanation.trim(),
    };
    const ok = isEdit
      ? await store.updateQuiz(unit, question!.id, payload)
      : await store.createQuiz(unit, courseSlug, payload);
    if (ok) {
      toast.success(isEdit ? "Quiz question updated" : "Quiz question added");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit quiz question" : "Add quiz question"}</DialogTitle>
          <DialogDescription>
            Unit {unit.order} · code format <code className="text-xs">{nextCode}</code>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Question text *</Label>
            <Textarea
              value={form.question_text}
              onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                ["A", "option_a"],
                ["B", "option_b"],
                ["C", "option_c"],
                ["D", "option_d"],
              ] as const
            ).map(([label, key]) => (
              <div key={label} className="grid gap-1">
                <Label>Option {label}</Label>
                <Input
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <Label>Correct answer *</Label>
            <Select
              value={form.correct_answer}
              onValueChange={(v) => setForm((f) => ({ ...f, correct_answer: v as QuizAnswer }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select the correct answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Explanation</Label>
            <Textarea
              value={form.explanation}
              onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
            />
          </div>

          {slice?.quizSaveError && (
            <p className="text-sm text-red-600">{slice.quizSaveError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : isEdit ? "Save changes" : "Add question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
