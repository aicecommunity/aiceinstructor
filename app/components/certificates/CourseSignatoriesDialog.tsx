"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useCertificateStore } from "../../store/useCertificateStore";
import type {
  CertificateCourse,
  CertificateDefinitionAssignment,
  CertificateTemplateType,
  SignatoryAssignment,
} from "../../types/certificates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CertificateCourse | null;
  definition: CertificateDefinitionAssignment | null;
}

function layoutLabel(signatureType: CertificateTemplateType): string {
  return signatureType === "2" ? "2 signatures" : "3 signatures";
}

export default function CourseSignatoriesDialog({ open, onOpenChange, course, definition }: Props) {
  const { signatories, templates, isAssigning, assigningError, assignSignatories } =
    useCertificateStore();

  // The dialog is remounted per definition (see `key` in CoursesSection), so the
  // state below always initializes fresh for the definition being edited.
  const [step, setStep] = useState<"layout" | "signatories">("layout");
  const [layoutId, setLayoutId] = useState<number | null>(definition?.layout?.id ?? null);
  const [assignments, setAssignments] = useState<SignatoryAssignment[]>(
    definition ? definition.signatories.map((s) => ({ id: s.id, order: s.order })) : [],
  );

  // Layouts are offered straight from the uploaded templates ("signature layout"
  // = two or three signature slots). Only active layouts are assignable.
  const availableLayouts = templates.filter((t) => t.is_active);
  const selectedLayout = availableLayouts.find((t) => t.id === layoutId) ?? null;
  const required = selectedLayout ? Number(selectedLayout.signature_type) : 0;

  // Signatories are auto-synced from the instructor/administrator registries,
  // so only those two sources can be assigned here.
  const selectable = signatories.filter(
    (s) => s.is_active && (s.source === "instructor" || s.source === "administrator"),
  );

  const isSelected = (id: number) => assignments.some((a) => a.id === id);

  const toggle = (id: number, checked: boolean) => {
    setAssignments((prev) => {
      if (!checked) return prev.filter((a) => a.id !== id);
      if (selectedLayout && prev.length >= required) {
        toast.error(
          `Only ${required} signatures are allowed for the ${layoutLabel(selectedLayout.signature_type)} layout.`,
        );
        return prev;
      }
      const nextOrder = prev.length > 0 ? Math.max(...prev.map((a) => a.order)) + 1 : 0;
      return [...prev, { id, order: nextOrder }];
    });
  };

  const setOrder = (id: number, raw: string) => {
    // Orders are stored 0-based but displayed starting at 1.
    const value = Math.max(0, (Number(raw) - 1) || 0);
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
    if (!course || !definition || !selectedLayout) return;
    if (assignments.length !== required) {
      toast.error(
        `You must choose exactly ${required} signatures for this layout — you currently have ${assignments.length}.`,
      );
      return;
    }
    const sorted = [...assignments].sort((a, b) => a.order - b.order);
    const updated = await assignSignatories(
      course.id,
      definition.definition_index,
      sorted,
      selectedLayout.signature_type,
    );
    if (updated) {
      onOpenChange(false);
    }
  };

  const assignedLabel = (id: number): string => {
    const prev = definition?.signatories.find((s) => s.id === id);
    return prev ? prev.name : selectable.find((s) => s.id === id)?.name ?? `#${id}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Signatories — {definition?.name ?? course?.title}
          </DialogTitle>
          <DialogDescription>
            First pick the certificate layout (two or three signatures), then choose
            exactly that many signatories.
          </DialogDescription>
        </DialogHeader>

        {step === "layout" ? (
          <>
            <div className="grid gap-2">
              {availableLayouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No certificate layouts exist yet. Upload a two- or three-signature
                  template in the section above first.
                </p>
              ) : (
                availableLayouts.map((tpl) => {
                  const active = tpl.id === layoutId;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setLayoutId(tpl.id)}
                      className={`flex items-center gap-3 rounded-md border p-3 text-left transition ${
                        active ? "border-[#195C49] bg-[#195C49]/5 ring-1 ring-[#195C49]" : "hover:bg-muted/40"
                      }`}
                    >
                      {tpl.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tpl.image_url}
                          alt={tpl.name}
                          className="h-14 w-24 shrink-0 rounded border object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded border bg-muted/40 text-[10px] text-muted-foreground">
                          No image
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{tpl.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {layoutLabel(tpl.signature_type)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="ml-auto shrink-0"
                      >
                        {active ? "Selected" : "Pick layout"}
                      </Badge>
                    </button>
                  );
                })
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => setStep("signatories")}
                disabled={!selectedLayout}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {selectedLayout && (
              <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-2.5">
                {selectedLayout.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedLayout.image_url}
                    alt={selectedLayout.name}
                    className="h-10 w-16 shrink-0 rounded border object-cover"
                  />
                )}
                <p className="min-w-0 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedLayout.name}</span>
                  {" · "}
                  {layoutLabel(selectedLayout.signature_type)}
                </p>
                <Badge
                  variant={assignments.length === required ? "default" : "secondary"}
                  className="ml-auto shrink-0"
                >
                  {assignments.length} of {required} chosen
                </Badge>
              </div>
            )}

            {assignments.length !== required && (
              <p className="text-sm font-medium text-amber-600">
                {assignments.length < required
                  ? `Choose ${required - assignments.length} more signature${required - assignments.length === 1 ? "" : "s"}.`
                  : `Remove ${assignments.length - required} signature${assignments.length - required === 1 ? "" : "s"} to match this layout.`}
              </p>
            )}

            <div className="grid max-h-[45vh] gap-1.5 overflow-y-auto pr-1">
              {selectable.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No instructors or administrators available to sign yet. Add one in the
                  Instructors or Administrators registry first.
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
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          {sig.name}
                          <Badge variant="secondary" className="px-1.5 text-[10px]">
                            {sig.source === "instructor" ? "Instructor" : "Administrator"}
                          </Badge>
                        </p>
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
                          min={1}
                          value={order + 1}
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

            {assignments.length === required && (
              <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Signature order</p>
                <p className="mt-1">
                  {[...assignments]
                    .sort((a, b) => a.order - b.order)
                    .map((a, i) => `${i + 1}. ${assignedLabel(a.id)}`)
                    .join(" · ")}
                </p>
              </div>
            )}

            {assigningError && <p className="text-sm text-red-600">{assigningError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("layout")}
                disabled={isAssigning}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isAssigning || assignments.length !== required}
              >
                {isAssigning ? "Saving..." : "Save assignments"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}