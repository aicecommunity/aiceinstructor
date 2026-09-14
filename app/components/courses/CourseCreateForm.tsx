"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCourseStore } from "../../store/useCourseStore";
import { formatNaira, nairaToNumber } from "@/lib/format";
import type { CourseCertificate, CourseStatus } from "../../types/course";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CertificatesEditor from "./CertificatesEditor";
import SignatureImagePicker from "../shared/SignatureImagePicker";

const PREFIX = "aice-";
const MAX_SLUG_CORE = 5;
const CURRENCY = "NGN";

/** Lightweight URL check — anything that new URL() accepts is valid. */
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

interface FormState {
  title: string;
  slug: string;
  description: string;
  duration_weeks: string;
  is_paid: boolean;
  price: string;
  group_link: string;
  status: CourseStatus;
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  description: "",
  duration_weeks: "",
  is_paid: false,
  price: "",
  group_link: "",
  status: "coming_soon",
};

interface FieldErrors {
  title?: string;
  slug?: string;
  description?: string;
  duration_weeks?: string;
  price?: string;
  certificates?: string;
  skillsErr?: string;
  image?: string;
  group_link?: string;
}

export default function CourseCreateForm() {
  const router = useRouter();
  const { createCourse, isSavingCourse, courseSaveError } = useCourseStore();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [certificates, setCertificates] = useState<CourseCertificate[]>([]);
  const [certificatesValid, setCertificatesValid] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [slugState, setSlugState] = useState<
    | { status: "idle" | "checking" | "ok" | "taken"; message?: string }
    | undefined
  >(undefined);

  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slugSeq = useRef(0);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const slugError = (rawInput: string): string | undefined => {
    const raw = rawInput.trim().toLowerCase();
    const core = raw.startsWith(PREFIX) ? raw.slice(PREFIX.length) : raw;
    if (!core) return "Slug is required.";
    if (/\s/.test(raw) || /[^a-z0-9-]/.test(raw))
      return "Lowercase letters, numbers and hyphens only (no spaces).";
    if (core.length > MAX_SLUG_CORE)
      return `Max ${MAX_SLUG_CORE} characters (the “aice-” prefix doesn’t count).`;
    return undefined;
  };

  const slugClientError = () => slugError(form.slug);

  const validateField = (
    key: "title" | "description" | "duration_weeks" | "price"
  ): string | undefined => {
    const v = form[key];
    switch (key) {
      case "title":
        return v.trim() ? undefined : "Title is required.";
      case "description":
        return v.trim() ? undefined : "Description is required.";
      case "duration_weeks": {
        const n = Number(v);
        if (v === "" || v == null || Number.isNaN(n))
          return "Duration is required.";
        if (n < 1) return "Duration must be at least 1 week.";
        return undefined;
      }
      case "price": {
        if (!form.is_paid) return undefined;
        if (v === "" || v == null) return "Price is required for a paid course.";
        const n = Number(nairaToNumber(v));
        if (Number.isNaN(n) || n < 0)
          return "Price must be 0 or a positive number.";
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const preflightSlug = (raw: string) => {
    if (slugTimer.current) clearTimeout(slugTimer.current);
    const seq = ++slugSeq.current;
    const err = slugError(raw);
    if (err) {
      setSlugState({ status: "idle", message: err });
      return;
    }
    setSlugState({ status: "checking" });
    slugTimer.current = setTimeout(async () => {
      const { courses } = await import("../../services/courses");
      try {
        const { data } = await courses.slugAvailable(raw);
        if (seq !== slugSeq.current) return;
        setSlugState(
          data.available ? { status: "ok" } : { status: "taken", message: "This slug is already taken." }
        );
      } catch (caught) {
        if (seq !== slugSeq.current) return;
        const payload = caught as {
          response?: { data?: { error?: string } };
        };
        const backendMsg = payload?.response?.data?.error;
        setSlugState(
          backendMsg
            ? { status: "taken", message: backendMsg }
            : { status: "idle", message: "Could not check slug availability." }
        );
      }
    }, 400);
  };

  const handleSlugChange = (value: string) => {
    set("slug", value);
    preflightSlug(value);
  };

  const visibleErrors: FieldErrors = {};
  if (touched.title) {
    const e = validateField("title");
    if (e) visibleErrors.title = e;
  }
  if (touched.description) {
    const e = validateField("description");
    if (e) visibleErrors.description = e;
  }
  if (touched.duration_weeks) {
    const e = validateField("duration_weeks");
    if (e) visibleErrors.duration_weeks = e;
  }
  if (touched.price) {
    const e = validateField("price");
    if (e) visibleErrors.price = e;
  }
  if (touched.slug) {
    const se = slugClientError();
    if (se) visibleErrors.slug = se;
    else if (slugState?.status === "taken") visibleErrors.slug = slugState.message;
  }
  if (touched.certificates && certificates.length === 0)
    visibleErrors.certificates = "Add at least one certificate.";
  if (touched.certificates && certificates.some((c) => c.skills.length === 0))
    visibleErrors.skillsErr = "Each certificate needs at least one skill.";
  if (touched.image && !imageFile)
    visibleErrors.image = "Upload a course cover image.";
  if (touched.group_link && form.group_link.trim() && !validLink(form.group_link))
    visibleErrors.group_link = "Enter a valid link (e.g. https://t.me/mygroup or https://wa.me/abc).";

  const fieldsValid =
    !validateField("title") &&
    !validateField("description") &&
    !validateField("duration_weeks") &&
    !validateField("price") &&
    !slugClientError();

  const groupLinkValid = !form.group_link.trim() || validLink(form.group_link);

  const canSubmit =
    fieldsValid && certificatesValid && slugState?.status === "ok" && Boolean(imageFile) && groupLinkValid && !isSavingCourse;

  const recordTouched = (key: string) =>
    setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      title: true,
      slug: true,
      description: true,
      duration_weeks: true,
      price: true,
      certificates: true,
      skills: true,
      image: true,
      group_link: true,
    });
    if (!canSubmit) return;

    const payload = {
      slug: form.slug.trim().toLowerCase(),
      title: form.title.trim(),
      description: form.description.trim(),
      duration_weeks: Number(form.duration_weeks),
      certificates,
      status: form.status,
      image: imageFile,
      group_link: form.group_link.trim(),
      is_paid: form.is_paid,
      price: form.is_paid ? Number(nairaToNumber(form.price)) : 0,
      currency: CURRENCY,
    };

    const saved = await createCourse(payload);
    if (saved) {
      toast.success("Course created");
      router.push("/");
    }
  };

  const storedSlugCore = form.slug.trim().toLowerCase().replace(/^aice-/, "");
  const previewSlug = PREFIX + (storedSlugCore || "___");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to Courses
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New course</h1>
      <p className="text-sm text-muted-foreground">
        Create a new course against the live /api/courses/ endpoint. All fields
        are required.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 grid gap-5 rounded-xl border bg-white p-6"
      >
        <div className="grid gap-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            onBlur={() => recordTouched("title")}
            placeholder="e.g. Software Engineering Fellowship"
            aria-invalid={Boolean(visibleErrors.title)}
          />
          {visibleErrors.title && (
            <p className="text-xs text-red-600">{visibleErrors.title}</p>
          )}
        </div>

        <SignatureImagePicker
          id="course-image"
          label="Course image *"
          file={imageFile}
          existingUrl={null}
          onFileChange={(file) => {
            setImageFile(file);
            recordTouched("image");
          }}
          required
          hint="Upload the course cover image (PNG/JPG). This is required to create the course."
          emptyText="No image"
        />
        {visibleErrors.image && (
          <p className="-mt-2 text-xs text-red-600">{visibleErrors.image}</p>
        )}

        <div className="grid gap-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            onBlur={() => recordTouched("slug")}
            placeholder="sef (1–5 chars, lowercase letters, numbers, hyphens)"
            aria-invalid={Boolean(visibleErrors.slug)}
          />
          <p className="text-xs text-muted-foreground">
            Stored as <code>{previewSlug}</code> — the “aice-” prefix is added
            for you and can’t be changed later.
          </p>
          {visibleErrors.slug && (
            <p className="text-xs text-red-600">{visibleErrors.slug}</p>
          )}
          {!visibleErrors.slug && slugState?.status === "checking" && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Checking availability…
            </p>
          )}
          {!visibleErrors.slug && slugState?.status === "ok" && (
            <p className="flex items-center gap-1 text-xs text-green-600">
              <Check className="size-3" /> Slug is available.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            onBlur={() => recordTouched("description")}
            placeholder="What the course is about"
            aria-invalid={Boolean(visibleErrors.description)}
          />
          {visibleErrors.description && (
            <p className="text-xs text-red-600">{visibleErrors.description}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="duration">Duration * (weeks)</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            value={form.duration_weeks}
            onChange={(e) => set("duration_weeks", e.target.value)}
            onBlur={() => recordTouched("duration_weeks")}
            placeholder="e.g. 12"
            aria-invalid={Boolean(visibleErrors.duration_weeks)}
          />
          {visibleErrors.duration_weeks && (
            <p className="text-xs text-red-600">
              {visibleErrors.duration_weeks}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="group_link">Group link (optional)</Label>
          <Input
            id="group_link"
            type="url"
            value={form.group_link}
            onChange={(e) => set("group_link", e.target.value)}
            onBlur={() => recordTouched("group_link")}
            placeholder="https://t.me/mygroup or https://wa.me/abc"
            aria-invalid={Boolean(visibleErrors.group_link)}
          />
          <p className="text-xs text-muted-foreground">
            Where your students can connect while the course runs — WhatsApp,
            Telegram, Discord, or any other social/community link. This field is
            optional.
          </p>
          {visibleErrors.group_link && (
            <p className="text-xs text-red-600">{visibleErrors.group_link}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(value) => set("status", value as CourseStatus)}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="coming_soon">Coming Soon</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Active = visible &amp; enrollable in the catalog · Coming Soon =
            visible but not yet open for enrollment · Inactive = hidden.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Pricing *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={form.is_paid ? "outline" : "default"}
              onClick={() => {
                set("is_paid", false);
                set("price", "");
              }}
            >
              Free
            </Button>
            <Button
              type="button"
              variant={form.is_paid ? "default" : "outline"}
              onClick={() => set("is_paid", true)}
            >
              Paid
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Sets the price of this course’s default program (enrollment). You
            can leave it Free for now and edit later.
          </p>
        </div>

        {form.is_paid && (
          <div className="grid gap-2">
            <Label htmlFor="price">Price (₦) *</Label>
            <Input
              id="price"
              type="text"
              inputMode="decimal"
              value={formatNaira(form.price)}
              onChange={(e) => set("price", formatNaira(e.target.value))}
              onBlur={() => recordTouched("price")}
              placeholder="e.g. 25,000"
              aria-invalid={Boolean(visibleErrors.price)}
            />
            <p className="text-xs text-muted-foreground">
              Shown with commas for readability; saved without them.
            </p>
            {visibleErrors.price && (
              <p className="text-xs text-red-600">
                {visibleErrors.price}
              </p>
            )}
          </div>
        )}

        <CertificatesEditor
          value={certificates}
          onChange={(next) => {
            setCertificates(next);
            recordTouched("certificates");
            if (next.some((c) => c.skills.length === 0)) recordTouched("skills");
          }}
          onValidityChange={setCertificatesValid}
        />
        {touched.certificates &&
          (visibleErrors.certificates || visibleErrors.skillsErr) && (
            <p className="-mt-2 text-xs text-red-600">
              {visibleErrors.certificates || visibleErrors.skillsErr}
            </p>
          )}

        {courseSaveError && (
          <p className="text-sm text-red-600">{courseSaveError}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isSavingCourse ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving…
              </>
            ) : (
              "Create course"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}