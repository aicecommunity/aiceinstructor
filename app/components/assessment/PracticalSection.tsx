"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { FolderGit2, Plus, Pencil, PenLine, Trash2 } from "lucide-react";
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
import type {
  PracticalQuestion,
  PracticalQuestionPayload,
  PracticalType,
  PracticalRule,
} from "../../types/assessment";

interface Props {
  enrollmentId: number;
  courseSlug: string;
  unit: CalendarUnit;
}

export default function PracticalSection({ enrollmentId, courseSlug, unit }: Props) {
  const store = useAssessmentStore();
  const slice = store.byUnit[unit.id];
  const practical = slice?.practicalQuestions ?? [];
  const [dialog, setDialog] = useState<{ open: boolean; question: PracticalQuestion | null }>({
    open: false,
    question: null,
  });

  const openCreate = () => setDialog({ open: true, question: null });
  const openEdit = (q: PracticalQuestion) => setDialog({ open: true, question: q });
  const close = () => setDialog((d) => ({ ...d, open: false }));

  const handleDelete = async (q: PracticalQuestion) => {
    if (!confirm(`Delete practical "${q.task_title}"?`)) return;
    await store.deletePractical(unit, q.id);
    toast.success("Practical deleted");
  };

  const nextCode = `${courseSlug}_prac_unit${unit.order}_${practical.length + 1}`;

  return (
    <div className="rounded-md border bg-muted/10">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Practical questions</span>
        <Button
          size="sm"
          variant="outline"
          onClick={openCreate}
          disabled={store.byUnit[unit.id]?.isSavingPractical}
        >
          <Plus className="size-4" /> Add practical
        </Button>
      </div>

      {practical.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">
          No practical questions yet. Add the first one.
        </p>
      ) : (
        <ul className="divide-y">
          {practical.map((q) => (
            <li key={q.id} className="flex items-start gap-3 px-4 py-3">
              {q.practical_type === "github" ? (
                <FolderGit2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              ) : (
                <PenLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">P{q.order}</Badge>
                  <span className="truncate text-sm font-medium">{q.task_title}</span>
                  <Badge variant="secondary">{q.practical_type}</Badge>
                  {!q.is_active && <Badge>Inactive</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {q.task_description}
                </p>
                <p className="mt-1 text-xs">
                  <span className="text-muted-foreground">Unit</span> {q.unit_order} ·{" "}
                  <span className="text-muted-foreground">max score</span> {q.max_score} ·{" "}
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

      <PracticalQuestionDialog
        key={dialog.question?.id ?? "new"}
        open={dialog.open}
        onOpenChange={close}
        enrollmentId={enrollmentId}
        courseSlug={courseSlug}
        unit={unit}
        nextCode={nextCode}
        question={dialog.question}
      />
    </div>
  );
}

function PracticalQuestionDialog({
  open,
  onOpenChange,
  enrollmentId,
  courseSlug,
  unit,
  nextCode,
  question,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentId: number;
  courseSlug: string;
  unit: CalendarUnit;
  nextCode: string;
  question: PracticalQuestion | null;
}) {
  const store = useAssessmentStore();
  const slice = store.byUnit[unit.id];
  const isSaving = slice?.isSavingPractical ?? false;
  const isEdit = Boolean(question);

  const [form, setForm] = useState(() => buildForm(question));
  const [rulesText, setRulesText] = useState(() =>
    JSON.stringify(question?.rules ?? [], null, 2)
  );
  const [termsText, setTermsText] = useState(() =>
    (question?.required_post_keywords ?? []).join(", ")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.practical_type) {
      toast.error("Please select a practical type.");
      return;
    }
    if (form.is_active === "") {
      toast.error("Please select whether the practical is active.");
      return;
    }
    let rules: PracticalRule[] = [];
    try {
      const parsed = JSON.parse(rulesText || "[]");
      rules = Array.isArray(parsed) ? parsed : [];
    } catch {
      toast.error("Rules must be a valid JSON array, e.g. [{\"description\":\"...\"}]");
      return;
    }
    const payload: PracticalQuestionPayload = {
      practical_type: form.practical_type as PracticalType,
      expected_link_provider: form.expected_link_provider as PracticalQuestionPayload["expected_link_provider"],
      required_post_title: form.required_post_title.trim(),
      required_post_keywords: termsText
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      required_likes_count: Number(form.required_likes_count),
      required_comments_count: Number(form.required_comments_count),
      required_min_words: Number(form.required_min_words),
      unit_order: unit.order,
      order: question?.order ?? 0,
      task_title: form.task_title.trim(),
      task_description: form.task_description.trim(),
      repository: form.repository.trim(),
      directory: form.directory.trim(),
      file_name: form.file_name.trim(),
      max_score: Number(form.max_score),
      branch: form.branch.trim(),
      starter_repo_url: form.starter_repo_url.trim(),
      rules,
      is_active: form.is_active === "true",
    };
    const ok = isEdit
      ? await store.updatePractical(unit, question!.id, payload)
      : await store.createPractical(unit, courseSlug, enrollmentId, payload);
    if (ok) {
      toast.success(isEdit ? "Practical updated" : "Practical added");
      onOpenChange(false);
    }
  };

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit practical" : "Add practical"}</DialogTitle>
          <DialogDescription>
            For unit {unit.order} · code format <code className="text-xs">{nextCode}</code>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Type *</Label>
              <Select
                value={form.practical_type}
                onValueChange={(v) => set("practical_type", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a practical type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">GitHub repository</SelectItem>
                  <SelectItem value="post">Community post</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Unit order (from unit)</Label>
              <Input value={String(unit.order)} disabled readOnly />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Task title *</Label>
            <Input
              value={form.task_title}
              onChange={(e) => set("task_title", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Task description</Label>
            <Textarea
              value={form.task_description}
              onChange={(e) => set("task_description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Max score</Label>
              <Input
                type="number"
                min={0}
                value={form.max_score}
                onChange={(e) => set("max_score", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Required likes</Label>
              <Input
                type="number"
                min={0}
                value={form.required_likes_count}
                onChange={(e) => set("required_likes_count", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Required comments</Label>
              <Input
                type="number"
                min={0}
                value={form.required_comments_count}
                onChange={(e) => set("required_comments_count", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Required min words</Label>
              <Input
                type="number"
                min={0}
                value={form.required_min_words}
                onChange={(e) => set("required_min_words", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Active</Label>
              <Select
                value={form.is_active}
                onValueChange={(v) => set("is_active", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose active or inactive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Required post title</Label>
            <Input
              value={form.required_post_title}
              onChange={(e) => set("required_post_title", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Required post keywords (comma separated)</Label>
            <Input
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              placeholder="python, pandas, data"
            />
          </div>

          {form.practical_type === "post" && (
            <div className="grid gap-2">
              <Label>Linked file to grade</Label>
              <Select
                value={form.expected_link_provider}
                onValueChange={(v) => set("expected_link_provider", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None — plain community post" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None — plain community post</SelectItem>
                  <SelectItem value="google_docs">Google Docs</SelectItem>
                  <SelectItem value="google_sheets">Google Sheets</SelectItem>
                  <SelectItem value="google_slides">Google Slides</SelectItem>
                  <SelectItem value="figma">Figma</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When set, students attach a post containing a link to this provider and
                the linked file&apos;s text is graded against the rules below. Plain-post
                checks (title/keywords/likes) are skipped in this mode.
              </p>
            </div>
          )}

          {form.practical_type === "github" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Repository</Label>
                  <Input
                    value={form.repository}
                    onChange={(e) => set("repository", e.target.value)}
                    placeholder={courseSlug}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Directory</Label>
                  <Input
                    value={form.directory}
                    onChange={(e) => set("directory", e.target.value)}
                    placeholder={`unit-${unit.order}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>File name</Label>
                  <Input
                    value={form.file_name}
                    onChange={(e) => set("file_name", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Branch</Label>
                  <Input
                    value={form.branch}
                    onChange={(e) => set("branch", e.target.value)}
                    placeholder="main"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Starter repo URL</Label>
                <Input
                  type="url"
                  value={form.starter_repo_url}
                  onChange={(e) => set("starter_repo_url", e.target.value)}
                  placeholder="https://github.com/..."
                />
              </div>
            </>
          )}

          {(form.practical_type === "github" ||
            (form.practical_type === "post" && form.expected_link_provider)) && (
            <div className="grid gap-2">
              <Label>Rules (JSON array)</Label>
              <Textarea
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                rows={4}
                className="font-mono text-xs"
                placeholder='[{"description":"Commit message convention","keyword":"feat:","is_required":true}]'
              />
              <p className="text-xs text-muted-foreground">
                Each rule: <code>{`{ "description": string, "keyword": string, "is_required": boolean }`}</code>
              </p>
            </div>
          )}

          {slice?.practicalSaveError && (
            <p className="text-sm text-red-600">{slice.practicalSaveError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : isEdit ? "Save changes" : "Add practical"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function buildForm(q: PracticalQuestion | null) {
  return {
    practical_type: (q?.practical_type ?? "") as PracticalType | "",
    expected_link_provider: (q?.expected_link_provider ?? "") as PracticalQuestion["expected_link_provider"],
    task_title: q?.task_title ?? "",
    task_description: q?.task_description ?? "",
    max_score: String(q?.max_score ?? 100),
    required_likes_count: String(q?.required_likes_count ?? 0),
    required_comments_count: String(q?.required_comments_count ?? 0),
    required_min_words: String(q?.required_min_words ?? 0),
    required_post_title: q?.required_post_title ?? "",
    repository: q?.repository ?? "",
    directory: q?.directory ?? "",
    file_name: q?.file_name ?? "",
    branch: q?.branch ?? "main",
    starter_repo_url: q?.starter_repo_url ?? "",
    is_active: q != null ? String(q.is_active) : "",
  };
}
