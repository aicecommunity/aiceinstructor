"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, ShieldQuestion, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentsStore } from "../../store/useStudentsStore";
import type {
  PracticalSubmission,
  PracticalSubmissionStatus,
  GradingOverridePayload,
} from "../../types/records";

const STATUS_PRESENT: Record<PracticalSubmissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  needs_revision: "Needs Revision",
  failed: "Failed",
  completed: "Completed",
};

interface Props {
  cohortId: number;
  submission: PracticalSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubmissionReviewDialog({ cohortId, submission, open, onOpenChange }: Props) {
  const { overrideSubmission, isOverriding, overrideError, getSubmission } = useStudentsStore();
  const [live, setLive] = useState<PracticalSubmission | null>(submission);
  const [form, setForm] = useState(() => buildForm(submission));

  useEffect(() => {
    if (open && submission) {
      getSubmission(cohortId, submission.id).then((fresh) => {
        setLive(fresh ?? submission);
        setForm(buildForm(fresh ?? submission));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submission?.id]);

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!live) return;
    const payload: GradingOverridePayload = {
      submission_id: live.id,
      score: Number(form.score),
      status: form.status,
      feedback: form.feedback.trim(),
      reason: form.reason.trim(),
    };
    const updated = await overrideSubmission(cohortId, payload);
    if (updated) {
      setLive(updated);
      toast.success("Override applied (mock — no server endpoint yet)");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review practical submission
            {live && (
              <Badge variant={live.status === "completed" ? "default" : "secondary"}>
                {STATUS_PRESENT[live.status]}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {live?.question_detail.task_title} · Unit {live?.question_detail.unit_order} ·{" "}
            {live?.question_detail.practical_type}
          </DialogDescription>
        </DialogHeader>

        {!live ? (
          <p className="text-sm text-muted-foreground">Could not load this submission.</p>
        ) : (
          <div className="grid gap-5">
            {/* Learner + links */}
            <div className="grid gap-1 rounded-md border bg-muted/20 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{live.profile}</span>
                <span className="text-xs text-muted-foreground">
                  Score {live.score ?? "—"}/{live.question_detail.max_score}
                </span>
              </div>
              {live.github_repo_url && (
                <a href={live.github_repo_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                  {live.github_repo_url}
                </a>
              )}
              {live.file_url && (
                <a href={live.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                  {live.file_url}
                </a>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(live.submitted_at).toLocaleString()}
              </p>
            </div>

            {/* Automated grading output */}
            <div>
              <h4 className="mb-2 text-sm font-medium">Automated grading (checker output)</h4>
              <ul className="divide-y rounded-md border">
                {live.ruleResults.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 px-3 py-2 text-sm">
                    {r.passed ? (
                      <Check className="size-4 shrink-0 text-green-600" />
                    ) : (
                      <X className="size-4 shrink-0 text-red-600" />
                    )}
                    <span className="flex-1">{r.description}</span>
                    {r.is_required && <Badge variant="outline">required</Badge>}
                  </li>
                ))}
              </ul>
              <pre className="mt-2 whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                {live.feedback}
              </pre>
            </div>

            {/* Instructor override — PROPOSAL */}
            <form onSubmit={handleOverride} className="grid gap-4 rounded-md border border-dashed p-4">
              <div className="flex items-start gap-2">
                <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-amber-700">Instructor override (proposal)</p>
                  <p className="mt-0.5">
                    No grading-override write endpoint exists yet. This form documents the
                    request shape a future endpoint should accept; submitting it only updates
                    local mock data.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Instructor score</Label>
                  <Input
                    type="number"
                    min={0}
                    max={live.question_detail.max_score}
                    value={form.score}
                    onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v as PracticalSubmissionStatus }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_PRESENT).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Feedback</Label>
                <Textarea
                  value={form.feedback}
                  onChange={(e) => setForm((f) => ({ ...f, feedback: e.target.value }))}
                  placeholder="Optional note to the learner…"
                />
              </div>
              <div className="grid gap-2">
                <Label>Reason for override</Label>
                <Textarea
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. manual review found the automated checker was too strict"
                />
              </div>

              {overrideError && <p className="text-sm text-red-600">{overrideError}</p>}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button type="submit" disabled={isOverriding} variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50">
                  {isOverriding ? "Applying…" : "Apply mock override"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function buildForm(s: PracticalSubmission | null) {
  return {
    score: String(s?.score ?? s?.question_detail.max_score ?? 100),
    status: (s?.status ?? "pending") as PracticalSubmissionStatus,
    feedback: "",
    reason: "",
  };
}
