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
import { Loader2 } from "lucide-react";
import { useCourseStore } from "../../store/useCourseStore";
import type {
  Course,
  CourseCertificate,
  CoursePayload,
} from "../../types/course";
import CertificatesEditor from "./CertificatesEditor";
import SignatureImagePicker from "../shared/SignatureImagePicker";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  course?: Course | null;
}

interface EditForm {
  title: string;
  description: string;
  duration_weeks: string;
  group_link: string;
}

/** Lightweight URL check — matches the one in CourseCreateForm. */
function validLink(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

function formFromCourse(course: Course | null | undefined): EditForm {
  if (!course)
    return { title: "", description: "", duration_weeks: "", group_link: "" };
  return {
    title: course.title ?? "",
    description: course.description ?? "",
    duration_weeks: String(course.duration_weeks ?? ""),
    group_link: course.group_link ?? "",
  };
}

function certsAreValid(certs: CourseCertificate[]): boolean {
  return (
    certs.length > 0 &&
    certs.every(
      (c) => c.name.trim() && c.skills.length >= 1 && c.skills.length <= 7
    )
  );
}

export default function CourseFormDialog({
  open,
  onOpenChange,
  onSaved,
  course,
}: Props) {
  const { updateCourse, isSavingCourse, courseSaveError } = useCourseStore();

  // The dialog is remounted per open (CoursesManager passes key={formKey}),
  // so initializing from the prop is safe without an effect.
  const [form, setForm] = useState<EditForm>(() => formFromCourse(course));
  const [certificates, setCertificates] = useState<CourseCertificate[]>(() =>
    course?.certificates?.length ? course.certificates : []
  );
  const [certificatesValid, setCertificatesValid] = useState(() =>
    certsAreValid(course?.certificates ?? [])
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const set = (key: keyof EditForm, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const groupLinkValid = !form.group_link.trim() || validLink(form.group_link);

  // The cover image is compulsory: a newly uploaded file OR the course's
  // existing image satisfies it.
  const hasImage = Boolean(
    imageFile || course?.image_url || course?.image
  );

  const fieldsValid =
    form.title.trim().length > 0 &&
    form.description.trim().length > 0 &&
    Number(form.duration_weeks) >= 1;

  const canSubmit =
    fieldsValid && certificatesValid && groupLinkValid && hasImage && !isSavingCourse;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !canSubmit) return;

    const payload: CoursePayload = {
      slug: course.slug, // immutable; sent back unchanged
      title: form.title.trim(),
      description: form.description.trim(),
      duration_weeks: Number(form.duration_weeks),
      certificates,
      is_active: course.is_active,
      group_link: form.group_link.trim(),
      ...(imageFile ? { image: imageFile } : {}),
    };

    const saved = await updateCourse(course.id, payload);
    if (saved) {
      toast.success("Course updated");
      onOpenChange(false);
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit course</DialogTitle>
          <DialogDescription>
            Save against the live /api/courses/ endpoint. Slug cannot be changed
            after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={course?.slug ?? ""} disabled />
            <p className="text-xs text-muted-foreground">
              Assigned on creation and immutable.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duration * (weeks)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={form.duration_weeks}
              onChange={(e) => set("duration_weeks", e.target.value)}
              required
            />
          </div>

          <SignatureImagePicker
            id="course-image"
            label="Course image *"
            file={imageFile}
            existingUrl={course?.image_url ?? null}
            onFileChange={setImageFile}
            hint="Upload the course cover image (PNG/JPG). Leave empty to keep the current one."
            emptyText="No image"
          />
          {!hasImage && (
            <p className="-mt-2 text-xs text-red-600">
              Upload a course cover image. Every course must have one.
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="group_link">Group link (optional)</Label>
            <Input
              id="group_link"
              type="url"
              value={form.group_link}
              onChange={(e) => set("group_link", e.target.value)}
              placeholder="https://t.me/mygroup or https://wa.me/abc"
            />
            <p className="text-xs text-muted-foreground">
              Where your students connect — WhatsApp, Telegram, Discord, or any
              other social/community link. Leave empty to clear.
            </p>
          </div>

          <CertificatesEditor
            value={certificates}
            onChange={setCertificates}
            onValidityChange={setCertificatesValid}
          />

          {courseSaveError && (
            <p className="text-sm text-red-600">{courseSaveError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSavingCourse ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}