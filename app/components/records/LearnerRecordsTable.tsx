"use client";

import { useState } from "react";
import { Check, FileSearch, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LearnerRecord, PracticalSubmission, PracticalSubmissionStatus } from "../../types/records";
import SubmissionReviewDialog from "./SubmissionReviewDialog";

const STATUS_BADGE: Record<PracticalSubmissionStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
  approved: { label: "Approved", cls: "bg-blue-100 text-blue-700" },
  needs_revision: { label: "Needs revision", cls: "bg-amber-100 text-amber-700" },
  failed: { label: "Failed", cls: "bg-red-100 text-red-700" },
  completed: { label: "Completed", cls: "bg-green-100 text-green-700" },
};

interface Props {
  cohortId: number;
  records: LearnerRecord[];
}

export default function LearnerRecordsTable({ cohortId, records }: Props) {
  const [review, setReview] = useState<{ open: boolean; submission: PracticalSubmission | null }>({
    open: false,
    submission: null,
  });

  const openReview = (submission: PracticalSubmission) => setReview({ open: true, submission });
  const close = () => setReview((r) => ({ ...r, open: false }));

  return (
    <div>
      <div className="overflow-x-auto rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Learner</TableHead>
              <TableHead>Completion</TableHead>
              <TableHead>Quiz attempts</TableHead>
              <TableHead>Practical submissions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((rec) => {
              const latestStatus = latestPracticalStatus(rec);
              return (
                <TableRow key={rec.profile.user_id}>
                  <TableCell>
                    <div className="font-medium">{rec.profile.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {rec.profile.aice_id} · {rec.profile.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CompletionBadge completed={rec.completion.is_completed} />
                  </TableCell>
                  <TableCell>
                    <QuizBadge attempts={rec.quiz_attempts} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {rec.practical_submissions.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No submission</span>
                      ) : (
                        rec.practical_submissions.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => openReview(sub)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs hover:bg-muted"
                            title={`Review: ${sub.question_detail.task_title}`}
                          >
                            <FileSearch className="size-3.5 text-muted-foreground" />
                            Unit {sub.question_detail.unit_order}
                            <StatusPill status={latestStatus} />
                          </button>
                        ))
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <SubmissionReviewDialog
        cohortId={cohortId}
        submission={review.submission}
        open={review.open}
        onOpenChange={close}
      />
    </div>
  );
}

function CompletionBadge({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <Badge className="gap-1 bg-green-100 text-green-700">
        <Check className="size-3.5" /> Completed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <XCircle className="size-3.5" /> In progress
    </Badge>
  );
}

function QuizBadge({ attempts }: { attempts: LearnerRecord["quiz_attempts"] }) {
  if (attempts.length === 0) {
    return <span className="text-sm text-muted-foreground">No attempt</span>;
  }
  const passed = attempts.filter((a) => a.passed).length;
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline">{attempts.length} attempt{sattempts(attempts)}</Badge>
      {passed === attempts.length && passed > 0 ? (
        <Badge className="gap-1 bg-green-100 text-green-700">
          <Check className="size-3.5" /> {passed}/{attempts.length} passed
        </Badge>
      ) : (
        <Badge variant="secondary">{passed}/{attempts.length} passed</Badge>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: PracticalSubmissionStatus | null }) {
  if (!status) return null;
  const s = STATUS_BADGE[status];
  return <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${s.cls}`}>{s.label}</span>;
}

function latestPracticalStatus(rec: LearnerRecord): PracticalSubmissionStatus | null {
  if (rec.practical_submissions.length === 0) return null;
  return rec.practical_submissions[rec.practical_submissions.length - 1].status;
}

function sattempts(attempts: LearnerRecord["quiz_attempts"]): string {
  return attempts.length === 1 ? "" : "s";
}
