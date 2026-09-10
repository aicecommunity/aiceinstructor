"use client";

import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useCertificateStore } from "../../store/useCertificateStore";
import type { Signatory } from "../../types/certificates";

interface Props {
  signatory: Signatory | null;
  onOpenChange: (open: boolean) => void;
}

export default function ConfirmDeleteSignatoryDialog({ signatory, onOpenChange }: Props) {
  const { deleteSignatory } = useCertificateStore();

  const handleConfirm = async () => {
    if (!signatory) return;
    await deleteSignatory(signatory.id);
    toast.success("Signatory deleted");
    onOpenChange(false);
  };

  return (
    <ConfirmDialog
      open={signatory !== null}
      onOpenChange={onOpenChange}
      title="Delete signatory?"
      description={
        <span>
          This removes <strong>{signatory?.name}</strong> and unassigns them from every
          course certificate. This cannot be undone.
        </span>
      }
      confirmLabel="Delete"
      onConfirm={handleConfirm}
    />
  );
}