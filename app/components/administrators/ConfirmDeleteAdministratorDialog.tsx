"use client";

import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useAdministratorStore } from "../../store/useAdministratorStore";
import type { Administrator } from "../../types/course";

interface Props {
  administrator: Administrator | null;
  onOpenChange: (open: boolean) => void;
}

export default function ConfirmDeleteAdministratorDialog({ administrator, onOpenChange }: Props) {
  const { deleteAdministrator } = useAdministratorStore();

  const handleConfirm = async () => {
    if (!administrator) return;
    await deleteAdministrator(administrator.id);
    toast.success("Administrator removed");
    onOpenChange(false);
  };

  return (
    <ConfirmDialog
      open={administrator !== null}
      onOpenChange={onOpenChange}
      title="Remove administrator?"
      description={
        <span>
          This removes <strong>{administrator?.name}</strong> from the administrator
          registry. They keep any other instructor access they have. This cannot be undone.
        </span>
      }
      confirmLabel="Remove"
      onConfirm={handleConfirm}
    />
  );
}