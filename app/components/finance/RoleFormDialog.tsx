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
import { finance } from "../../services/finance";
import type { RevenueRole } from "../../types/finance";

const COLOR_PRESETS = [
  "#195C49",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#16A34A",
  "#0D9488",
  "#B91C1C",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RevenueRole | null;
  platformPercent: number;
  allocatedPercent: number;
  onSaved: () => void;
}

export default function RoleFormDialog({ open, onOpenChange, role, platformPercent, allocatedPercent, onSaved }: Props) {
  const isEdit = Boolean(role);
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [color, setColor] = useState(role?.color || COLOR_PRESETS[0]);
  const [percent, setPercent] = useState(role ? String(role.percent) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setColor(role?.color || COLOR_PRESETS[0]);
    setPercent(role ? String(role.percent) : "");
    setError(null);
  }, [open, role]);

  const available = Math.round(
    (platformPercent - (allocatedPercent - (role ? role.percent : 0))) * 100
  ) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Role name is required.");
      return;
    }
    const value = Number(percent);
    if (!percent || Number.isNaN(value) || value <= 0 || value >= 100) {
      toast.error("Percent must be between 0 and 100.");
      return;
    }
    if (value > platformPercent) {
      toast.error(`Percent cannot exceed the platform share (${platformPercent}%).`);
      return;
    }
    if (value > available) {
      toast.error(`Total role allocation can't exceed the platform share — only ${available}% is available.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        color,
        percent: value,
      };
      if (isEdit) {
        await finance.updateRole(role!.id, payload);
        toast.success("Role updated");
      } else {
        await finance.createRole(payload);
        toast.success("Role created");
      }
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to save role.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit revenue role" : "Add revenue role"}</DialogTitle>
          <DialogDescription>
            A role slices off a percent of total revenue. Members added to the role
            split that percent equally.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="role-name">Role name *</Label>
            <Input
              id="role-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Platform Operations"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role-desc">Description</Label>
            <Textarea
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this role does on the platform"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label>Colour</Label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-7 rounded-full border-2 ${
                    color === c ? "border-gray-800" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Colour ${c}`}
                />
              ))}
              <Input
                aria-label="Custom colour"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-9 w-14 cursor-pointer p-1"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role-percent">Percent of total revenue *</Label>
            <Input
              id="role-percent"
              type="number"
              step="0.01"
              min={0.01}
              max={Math.max(available, 0) || platformPercent}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder={`e.g. 25 (platform keeps ${platformPercent}%)`}
            />
            <p className="text-xs text-muted-foreground">
              Members assigned to this role split its percent equally between them.
            </p>
            <p className={`text-xs ${available <= 0 ? "text-amber-700" : "text-muted-foreground"}`}>
              {available > 0
                ? `${available}% of the platform's ${platformPercent}% is still available.`
                : "The platform share is fully allocated — lower another role first."}
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}