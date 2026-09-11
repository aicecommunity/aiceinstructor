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
import { useTitleStore } from "../../store/useTitleStore";
import type { AdministratorTitle, AdministratorTitlePayload } from "../../types/course";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: AdministratorTitle | null;
}

export default function TitleFormDialog({ open, onOpenChange, title }: Props) {
  const { createTitle, updateTitle, isSavingTitle, titleSaveError } = useTitleStore();

  const [name, setName] = useState(title?.name ?? "");
  const [order, setOrder] = useState(title?.order?.toString() ?? "");

  useEffect(() => {
    if (!open) return;
    setName(title?.name ?? "");
    setOrder(title?.order?.toString() ?? "");
  }, [open, title]);

  const isEdit = Boolean(title);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    const payload: AdministratorTitlePayload = {
      name: name.trim(),
      // Send null/undefined when blank so the backend auto-assigns the next order.
      order: order === "" ? null : Number(order),
    };

    const saved = isEdit
      ? await updateTitle(title!.id, payload)
      : await createTitle(payload);

    if (saved) {
      toast.success(isEdit ? "Title updated" : "Title created");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit title" : "Add title"}</DialogTitle>
          <DialogDescription>
            Administrator titles define the role shown on certificates. Leave order
            blank to auto-assign the next number in the sequence.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title-name">Title name *</Label>
            <Input
              id="title-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Director, Assistant Director"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title-order">Order</Label>
            <Input
              id="title-order"
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="Auto-assign"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to place this title at the end of the sequence.
            </p>
          </div>

          {titleSaveError && (
            <p className="text-sm text-red-600">{titleSaveError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingTitle}>
              {isSavingTitle ? "Saving..." : isEdit ? "Save changes" : "Add title"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
