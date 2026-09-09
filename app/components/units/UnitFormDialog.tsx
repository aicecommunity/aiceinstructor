"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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
import { useUnitStore } from "../../store/useUnitStore";
import type { CalendarUnit, CalendarUnitPayload } from "../../types/curriculum";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentId: number;
  unit?: CalendarUnit | null;
}

interface UnitForm {
  title: string;
  description: string;
  duration_days: string;
  order: string;
}

function formFromUnit(unit?: CalendarUnit | null): UnitForm {
  if (!unit) return { title: "", description: "", duration_days: "", order: "" };
  return {
    title: unit.title,
    description: unit.description,
    duration_days: String(unit.duration_days),
    order: String(unit.order),
  };
}

export default function UnitFormDialog({
  open,
  onOpenChange,
  enrollmentId,
  unit,
}: Props) {
  const { createUnit, updateUnit, isSavingUnit, unitSaveError, clearUnitSaveError } = useUnitStore();
  const [form, setForm] = useState<UnitForm>(() => formFromUnit(unit));
  const isEdit = Boolean(unit);

  useEffect(() => {
    clearUnitSaveError();
    if (open) {
      setForm(formFromUnit(unit));
    } else {
      setForm({ title: "", description: "", duration_days: "", order: "" });
    }
  }, [open, unit, clearUnitSaveError]);

  const set = (key: keyof UnitForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CalendarUnitPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      duration_days: Number(form.duration_days) || 0,
    };
    if (form.order.trim() !== "") {
      payload.order = Number(form.order);
    }

    const saved = isEdit
      ? await updateUnit(enrollmentId, unit!.id, payload)
      : await createUnit(enrollmentId, payload);

    if (saved) {
      toast.success(isEdit ? "Unit updated" : "Unit added");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit unit" : "Add unit"}</DialogTitle>
          <DialogDescription>
            Duration and order follow the real CalendarUnit model. No two units in a
            calendar can share the same order.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="unit-title">Title *</Label>
            <Input
              id="unit-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              placeholder="e.g. JavaScript Fundamentals"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="unit-description">Description *</Label>
            <Textarea
              id="unit-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
              placeholder="What this unit covers"
              className="h-32 resize-none overflow-y-auto"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="unit-duration">Duration (days) *</Label>
              <Input
                id="unit-duration"
                type="number"
                min={1}
                required
                value={form.duration_days}
                onChange={(e) => set("duration_days", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit-order">Order (optional)</Label>
              <Input
                id="unit-order"
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => set("order", e.target.value)}
                placeholder="e.g. 1"
              />
            </div>
            <p className="col-start-2 -mt-2 text-xs text-muted-foreground">
              Leave blank to auto-assign.
            </p>
          </div>

          {unitSaveError && <p className="text-sm text-red-600">{unitSaveError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingUnit}>
              {isSavingUnit ? "Saving..." : isEdit ? "Save changes" : "Add unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
