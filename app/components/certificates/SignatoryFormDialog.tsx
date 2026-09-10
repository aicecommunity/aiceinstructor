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
import { useCertificateStore } from "../../store/useCertificateStore";
import type { Signatory, SignatoryPayload } from "../../types/certificates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signatory?: Signatory | null;
}

export default function SignatoryFormDialog({ open, onOpenChange, signatory }: Props) {
  const { createSignatory, updateSignatory, isSavingSignatory, signatorySaveError } =
    useCertificateStore();

  const isEdit = Boolean(signatory);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(signatory?.name ?? "");
    setTitle(signatory?.title ?? "");
    setOrganization(signatory?.organization ?? "");
    setOrder(String(signatory?.order ?? 0));
    setIsActive(signatory?.is_active ?? true);
  }, [open, signatory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required (e.g. Chief Executive Officer).");
      return;
    }

    const payload: SignatoryPayload = {
      name: name.trim(),
      title: title.trim(),
      organization: organization.trim(),
      order: Math.max(0, Number(order) || 0),
      is_active: isActive,
    };

    const saved = isEdit
      ? await updateSignatory(signatory!.id, payload)
      : await createSignatory(payload);

    if (saved) {
      toast.success(isEdit ? "Signatory updated" : "Signatory added");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit signatory" : "Add signatory"}</DialogTitle>
          <DialogDescription>
            Signatories appear on course certificates in their assigned order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sig-name">Name *</Label>
            <Input
              id="sig-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Prof. Ada Lovelace"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sig-title">Title *</Label>
            <Input
              id="sig-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chief Executive Officer"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sig-org">Organization</Label>
            <Input
              id="sig-org"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. AiCE"
            />
          </div>

          <div className="grid grid-cols-2 items-end gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sig-order">Order</Label>
              <Input
                id="sig-order"
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm" htmlFor="sig-active">
              <input
                id="sig-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 accent-[#195C49]"
              />
              Active
            </label>
          </div>

          {signatorySaveError && <p className="text-sm text-red-600">{signatorySaveError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingSignatory}>
              {isSavingSignatory ? "Saving..." : isEdit ? "Save changes" : "Add signatory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}