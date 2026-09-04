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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnitStore } from "../../store/useUnitStore";
import type {
  CalendarUnitContent,
  CalendarUnitContentPayload,
  ContentType,
} from "../../types/curriculum";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentId: number;
  unitId: number;
  content?: CalendarUnitContent | null;
}

const TYPES: { value: ContentType; label: string }[] = [
  { value: "video", label: "Lesson Video" },
  { value: "pdf", label: "PDF Document" },
  { value: "link", label: "External Link" },
];

export default function ContentFormDialog({
  open,
  onOpenChange,
  enrollmentId,
  unitId,
  content,
}: Props) {
  const { createContent, updateContent, isSavingContent, contentSaveError } = useUnitStore();
  const [form, setForm] = useState(() => ({
    content_type: (content?.content_type ?? "video") as ContentType,
    title: content?.title ?? "",
    url: content?.url ?? "",
    description: content?.description ?? "",
    duration_minutes: content?.duration_minutes != null ? String(content.duration_minutes) : "",
    is_required: content ? String(content.is_required) : "false",
  }));
  const isEdit = Boolean(content);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CalendarUnitContentPayload = {
      content_type: form.content_type,
      title: form.title.trim(),
      url: form.url.trim(),
      description: form.description.trim(),
      duration_minutes:
        form.duration_minutes === "" ? null : Number(form.duration_minutes),
      is_required: form.is_required === "true",
    };

    const saved = isEdit
      ? await updateContent(enrollmentId, unitId, content!.id, payload)
      : await createContent(enrollmentId, unitId, payload);

    if (saved) {
      toast.success(isEdit ? "Content updated" : "Content added");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit content" : "Add content"}</DialogTitle>
          <DialogDescription>
            Video, PDF, or link within the selected unit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Type *</Label>
            <Select
              value={form.content_type}
              onValueChange={(v) => set("content_type", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content-title">Title *</Label>
            <Input
              id="content-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              placeholder="e.g. Intro to JavaScript"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content-url">URL *</Label>
            <Input
              id="content-url"
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              required
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content-description">Description</Label>
            <Textarea
              id="content-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="content-duration">Duration (minutes)</Label>
              <Input
                id="content-duration"
                type="number"
                min={0}
                value={form.duration_minutes}
                onChange={(e) => set("duration_minutes", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Required</Label>
              <Select
                value={form.is_required}
                onValueChange={(v) => set("is_required", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {contentSaveError && (
            <p className="text-sm text-red-600">{contentSaveError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingContent}>
              {isSavingContent ? "Saving..." : isEdit ? "Save changes" : "Add content"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
