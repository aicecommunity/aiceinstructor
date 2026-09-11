"use client";

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
import { useTitleStore } from "../../store/useTitleStore";
import type { AdministratorTitle } from "../../types/course";

interface Props {
  title?: AdministratorTitle | null;
  onOpenChange: (next: boolean) => void;
}

export default function ConfirmDeleteTitleDialog({ title, onOpenChange }: Props) {
  const { deleteTitle, isDeletingTitle } = useTitleStore();

  if (!title) return null;

  const handleDelete = async () => {
    const ok = await deleteTitle(title.id);
    if (ok) {
      toast.success("Title deleted");
      onOpenChange(false);
    } else {
      toast.error("Could not delete title. Please try again.");
    }
  };

  return (
    <Dialog
      open={Boolean(title)}
      onOpenChange={(next) => {
        if (!next && isDeletingTitle) return;
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete title</DialogTitle>
          <DialogDescription>
            This will permanently remove <strong>{title.name}</strong>. If any
            administrators currently use this title the backend will block
            deletion with an error (you must reassign them first).
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" disabled={isDeletingTitle} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isDeletingTitle} onClick={handleDelete}>
            {isDeletingTitle ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
