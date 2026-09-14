"use client";

import { useEffect, useRef, useState } from "react";
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
import { curriculum } from "../../services/curriculum";
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

const MAX_PDF_BYTES = 10 * 1024 * 1024;

export default function ContentFormDialog({
  open,
  onOpenChange,
  enrollmentId,
  unitId,
  content,
}: Props) {
  const { createContent, updateContent, isSavingContent, contentSaveError, clearContentSaveError } = useUnitStore();
  const [form, setForm] = useState(() => ({
    content_type: (content?.content_type ?? "") as "" | ContentType,
    title: content?.title ?? "",
    url: content?.url ?? "",
    description: content?.description ?? "",
  }));
  const [pdfFileName, setPdfFileName] = useState("");
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(content);
  const isPdfType = form.content_type === "pdf";

  useEffect(() => {
    clearContentSaveError();
    if (open) {
      setForm({
        content_type: (content?.content_type ?? "") as "" | ContentType,
        title: content?.title ?? "",
        url: content?.url ?? "",
        description: content?.description ?? "",
      });
      setPdfFileName("");
    }
  }, [open, content, clearContentSaveError]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handlePDFChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error("PDF file must not exceed 10 MB.");
      return;
    }

    setIsUploadingPDF(true);
    try {
      const { data } = await curriculum.uploadPDF(unitId, file);
      setForm((f) => ({ ...f, url: data.url }));
      setPdfFileName(file.name);
      toast.success("PDF uploaded");
    } catch {
      toast.error("Failed to upload PDF. Please try again.");
    } finally {
      setIsUploadingPDF(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content_type) {
      toast.error("Please select a content type.");
      return;
    }
    if (isPdfType && !form.url) {
      toast.error("Please upload a PDF document first.");
      return;
    }
    const payload: CalendarUnitContentPayload = {
      content_type: form.content_type as ContentType,
      title: form.title.trim(),
      url: form.url.trim(),
      description: form.description.trim(),
      duration_minutes: null,
      is_required: false,
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
                <SelectValue placeholder="Select a content type" />
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
          {isPdfType ? (
            <div className="grid gap-2">
              <Label>PDF Document *</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handlePDFChange}
                disabled={isUploadingPDF}
              />
              {isUploadingPDF ? (
                <p className="text-sm text-muted-foreground">Uploading PDF...</p>
              ) : pdfFileName ? (
                <p className="text-sm text-green-600">
                  Uploaded: {pdfFileName}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 px-2 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace
                  </Button>
                </p>
              ) : form.url ? (
                <p className="text-sm text-green-600">
                  Existing PDF attached
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 px-2 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace
                  </Button>
                </p>
              ) : null}
            </div>
          ) : (
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
          )}
          <div className="grid gap-2">
            <Label htmlFor="content-description">Description</Label>
            <Textarea
              id="content-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
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
