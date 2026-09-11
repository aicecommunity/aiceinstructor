"use client";

import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useCertificateStore } from "../../store/useCertificateStore";
import type { CertificateTemplate } from "../../types/certificates";

interface Props {
  template: CertificateTemplate | null;
  onOpenChange: (open: boolean) => void;
}

export default function ConfirmDeleteTemplateDialog({ template, onOpenChange }: Props) {
  const { deleteTemplate, isDeletingTemplate } = useCertificateStore();

  const handleConfirm = async () => {
    if (!template) return;
    const ok = await deleteTemplate(template.id);
    if (ok) {
      toast.success("Template deleted");
      onOpenChange(false);
    } else {
      toast.error("Could not delete template. Please try again.");
    }
  };

  return (
    <ConfirmDialog
      open={template !== null}
      onOpenChange={(next) => {
        if (!next && isDeletingTemplate) return;
        onOpenChange(next);
      }}
      title="Delete template?"
      description={
        <span>
          This removes <strong>{template?.name}</strong> and its image. Certificates
          that reference this layout will show no template until one is re-added.
        </span>
      }
      confirmLabel="Delete"
      loading={isDeletingTemplate}
      onConfirm={handleConfirm}
    />
  );
}