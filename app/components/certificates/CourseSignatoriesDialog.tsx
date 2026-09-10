"use client";

import { useEffect, useState } from "react";
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
import { useCertificateStore } from "../../store/useCertificateStore";
import type { CertificateCourse, SignatoryAssignment } from "../../types/certificates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CertificateCourse | null;
}

export default function CourseSignatoriesDialog({ open, onOpenChange, course }: Props) {
  const { signatories, isAssigning, assigningError, assignSignatories } = useCertificateStore();

  const [assignments, setAssignments] = useState<SignatoryAssignment[]>([]);

  // Active signatories only can be assigned.
  const selectable = signatories.filter((s) => s.is_active);

  useEffect(() => {
    if (!open || !course) return;
    setAssignments(course.signatories.map((s) => ({ id: s.id, order: s.order })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, course]);

  const isSelected = (id: number) => assignments.some((a) => a.id === id);

  const toggle = (id: number, checked: boolean) => {
    setAssignments((prev) => {
      if (!checked) return prev.filter((a) => a.id !== id);
      const nextOrder = prev.length > 0 ? Math.max(...prev.map((a) => a.order)) + 1 : 0;
      return [...prev, { id, order: nextOrder }];
    });
  };

  const setOrder = (id: number, raw: string) => {
    const value = Math.max(0, Number(raw) || 0);
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, order: value } : a)));
  };

  const move = (id: number, delta: -1 | 1) => {
    setAssignments((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((a) => a.id === id);
      const swapIndex = index + delta;
      if (index < 0 || swapIndex < 0 || swapIndex >= sorted.length) return prev;
      const next = [...sorted];
      const [item] = next.splice(index, 1);
      next.splice(swapIndex, 0, item);
      return next.map((a, i) => ({ ...a, order: i }));
    });
  };

  const handleSave = async () => {
    if (!course) return;
    const sorted = [...assignments].sort((a, b) => a.order - b.order);
    const updated = await assignSignatories(course.id, sorted);
    if (updated) {
      onOpenChange(false);
    }
  };

  const assignedLabel = (id: number): string => {
    const prev = course?.signatories.find((s) => s.id === id);
    return prev ? prev.name : selectable.find((s) => s.id === id)?.name ?? `#${id}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Signatories — {course?.title}</DialogTitle>
          <DialogDescription>
            Tick the signatories whose names should appear on this course&apos;s certificate
            and set their order. Unticking removes them.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[50vh] gap-1.5 overflow-y-auto pr-1">
          {selectable.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No active signatories yet. Add them in the signatories section first.
            </p>
          )}
          {selectable.map((sig) => {
            const selected = isSelected(sig.id);
            const order = assignments.find((a) => a.id === sig.id)?.order ?? 0;
            return (
              <div
                key={sig.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <label className="flex min-w-0 flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => toggle(sig.id, e.target.checked)}
                    className="size-4 accent-[#195C49]"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{sig.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{sig.title || "—"}</p>
                  </div>
                </label>
                {selected && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => move(sig.id, -1)}
                      aria-label={`Move ${sig.name} up`}
                    >
                      ↑
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      value={order}
                      onChange={(e) => setOrder(sig.id, e.target.value)}
                      className="h-7 w-16"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => move(sig.id, 1)}
                      aria-label={`Move ${sig.name} down`}
                    >
                      ↓
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {assignments.length > 0 && (
          <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Signature order</p>
            <p className="mt-1">
              {[...assignments]
                .sort((a, b) => a.order - b.order)
                .map((a) => assignedLabel(a.id))
                .join(" · ")}
            </p>
          </div>
        )}

        {assigningError && <p className="text-sm text-red-600">{assigningError}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isAssigning}>
            {isAssigning ? "Saving..." : "Save assignments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}