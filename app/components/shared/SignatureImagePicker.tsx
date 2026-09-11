"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  id: string;
  label: string;
  file: File | null;
  existingUrl: string | null;
  onFileChange: (file: File | null) => void;
  required?: boolean;
  hint?: string;
  emptyText?: string;
}

// File-picker with a live preview. On edit, `existingUrl` shows the current
// signature/image; picking a file replaces it on save (stays multipart). Clearing
// a brand-new pick reverts to the existing/empty state.
export default function SignatureImagePicker({
  id,
  label,
  file,
  existingUrl,
  onFileChange,
  required,
  hint,
  emptyText = "No signature",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    if (picked) {
      setPreviewUrl(URL.createObjectURL(picked));
      onFileChange(picked);
    }
  };

  const clearPick = () => {
    onFileChange(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const showUrl = previewUrl ?? existingUrl;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        {showUrl ? (
          <img
            src={showUrl}
            alt="Signature preview"
            className="h-16 w-auto rounded border bg-white p-1"
          />
        ) : (
          <div className="flex h-16 w-28 items-center justify-center rounded border border-dashed text-center text-xs text-muted-foreground">
            {emptyText}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Input
            id={id}
            ref={inputRef}
            type="file"
            accept="image/*"
            required={required}
            className="file:text-xs"
            onChange={handleChange}
          />
          {previewUrl && (
            <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={clearPick}>
              <X className="size-3.5" /> Remove
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {hint ?? "Upload the handwritten signature (PNG with transparency recommended)."}
      </p>
    </div>
  );
}