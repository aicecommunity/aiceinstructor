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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCertificateStore } from "../../store/useCertificateStore";
import SignatureImagePicker from "../shared/SignatureImagePicker";
import type {
  CertificateTemplate,
  CertificateTemplatePayload,
  CertificateTemplateType,
} from "../../types/certificates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: CertificateTemplate | null;
}

export default function TemplateFormDialog({ open, onOpenChange, template }: Props) {
  const { createTemplate, updateTemplate, isSavingTemplate, templateSaveError, clearTemplateSaveError } =
    useCertificateStore();

  const isEdit = Boolean(template);

  const [name, setName] = useState("");
  const [signatureType, setSignatureType] = useState<CertificateTemplateType>("2");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      // Seed the form when opening (empty for "create", existing values for "edit").
      setName(template?.name ?? "");
      setSignatureType(template?.signature_type ?? "2");
      setImageFile(null);
      setIsActive(template?.is_active ?? true);
    } else {
      // On close, clear every field and any leftover save error.
      clearTemplateSaveError();
      setName("");
      setSignatureType("2");
      setImageFile(null);
      setIsActive(true);
    }
  }, [open, template, clearTemplateSaveError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!isEdit && !imageFile) {
      toast.error("Upload the certificate template image.");
      return;
    }

    const payload: CertificateTemplatePayload = {
      name: name.trim(),
      signature_type: signatureType,
      is_active: isActive,
      // Only send a new file — omitting it on edit keeps the existing image.
      ...(imageFile ? { image: imageFile } : {}),
    };

    const saved = isEdit
      ? await updateTemplate(template!.id, payload)
      : await createTemplate(payload);

    if (saved) {
      toast.success(isEdit ? "Template updated" : "Template added");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit certificate template" : "Add certificate template"}</DialogTitle>
          <DialogDescription>
            Upload the background image for a certificate. Choose whether the
            layout has two or three signature slots.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tpl-name">Name *</Label>
            <Input
              id="tpl-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Two-Signature Template"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tpl-type">Signature layout *</Label>
            <Select
              value={signatureType}
              onValueChange={(val) => setSignatureType(val as CertificateTemplateType)}
            >
              <SelectTrigger className="w-full" id="tpl-type">
                <SelectValue placeholder="Choose a layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Two signatures</SelectItem>
                <SelectItem value="3">Three signatures</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only one template is allowed per layout.
            </p>
          </div>

          <SignatureImagePicker
            id="tpl-image"
            label="Background image *"
            file={imageFile}
            existingUrl={template?.image_url ?? null}
            onFileChange={setImageFile}
            required={!isEdit}
            hint={
              isEdit
                ? "Leave blank on edit to keep the current image."
                : "Upload the certificate background image (PNG/JPG)."
            }
          />

          <label className="flex items-center gap-2 text-sm" htmlFor="tpl-active">
              <input
                id="tpl-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 accent-[#195C49]"
              />
              Active
            </label>

          {templateSaveError && <p className="text-sm text-red-600">{templateSaveError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingTemplate}>
              {isSavingTemplate ? "Saving..." : isEdit ? "Save changes" : "Add template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}