"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Check, Loader2, Search, X } from "lucide-react";
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
import { instructors as instructorsService } from "../../services/instructors";
import { useAdministratorStore } from "../../store/useAdministratorStore";
import SignatureImagePicker from "../shared/SignatureImagePicker";
import type { Administrator, InstructorCandidate, AdministratorPayload } from "../../types/course";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  administrator?: Administrator | null;
}

function candidateFromAdministrator(admin: Administrator): InstructorCandidate | null {
  if (admin.profile_id == null || !admin.email) return null;
  return {
    user_id: admin.profile_id,
    full_name: admin.name,
    email: admin.email,
    username: "",
  };
}

export default function AdministratorFormDialog({
  open,
  onOpenChange,
  administrator,
}: Props) {
  const { createAdministrator, updateAdministrator, isSavingAdministrator, administratorSaveError } =
    useAdministratorStore();

  const [query, setQuery] = useState(administrator?.name ?? "");
  const [selected, setSelected] = useState<InstructorCandidate | null>(
    administrator ? candidateFromAdministrator(administrator) : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<InstructorCandidate[]>([]);
  const [openList, setOpenList] = useState(false);
  const [searching, setSearching] = useState(false);
  const [title, setTitle] = useState(administrator?.title ?? "");
  const [signatoryName, setSignatoryName] = useState(administrator?.signatory_name ?? "");
  const [sigFile, setSigFile] = useState<File | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const isEdit = Boolean(administrator);

  useEffect(() => {
    if (!open) return;
    setQuery(administrator?.name ?? "");
    setSelected(administrator ? candidateFromAdministrator(administrator) : null);
    setTitle(administrator?.title ?? "");
    setSignatoryName(administrator?.signatory_name ?? "");
    setSigFile(null);
    setSearchQuery("");
    setResults([]);
    setOpenList(false);
  }, [open, administrator]);

  // Debounced search while the superuser types a name/email.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await instructorsService.searchCandidates(q);
        if (cancelled) return;
        setResults(data);
        setOpenList(data.length > 0);
      } catch {
        if (!cancelled) {
          setResults([]);
          setOpenList(false);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    if (!openList) return;
    function onClick(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setOpenList(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openList]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelected(null);
    if (!value.trim()) {
      setResults([]);
      setOpenList(false);
    }
    setSearchQuery(value);
  };

  const pickCandidate = (candidate: InstructorCandidate) => {
    setSelected(candidate);
    setQuery(candidate.full_name);
    setOpenList(false);
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selected) {
      toast.error("Search and pick a registered user for this administrator.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!signatoryName.trim()) {
      toast.error("Signatory name is required.");
      return;
    }
    if (!isEdit && !sigFile) {
      toast.error("Upload the administrator's signature image.");
      return;
    }

    const payload: AdministratorPayload = {
      profile_id: selected.user_id,
      title: title.trim(),
      signatory_name: signatoryName.trim(),
      // Only send a signature when a new one was picked — omitting it on edit
      // keeps the existing image on the backend (sending null would wipe it).
      ...(sigFile ? { signature_image: sigFile } : {}),
    };

    const saved = isEdit
      ? await updateAdministrator(administrator!.id, payload)
      : await createAdministrator(payload);

    if (saved) {
      toast.success(isEdit ? "Administrator updated" : "Administrator added");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit administrator" : "Add administrator"}</DialogTitle>
          <DialogDescription>
            Administrators are senior instructors — they get access to the same
            instructor features. Pick an existing user by name or email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="adm-pick">Administrator *</Label>
            <div ref={listRef} className="relative">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="adm-pick"
                  className="pl-9"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onFocus={() => {
                    if (!selected && results.length > 0) setOpenList(true);
                  }}
                  placeholder="Search name or email…"
                  autoComplete="off"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>

              {selected && (
                <div className="mt-2 flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                  <Check className="size-4 text-green-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{selected.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{selected.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-6"
                    onClick={clearSelection}
                    aria-label="Clear selection"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}

              {openList && !selected && results.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-background shadow-md">
                  {results.map((candidate) => (
                    <button
                      key={candidate.user_id}
                      type="button"
                      onClick={() => pickCandidate(candidate)}
                      className="block w-full px-3 py-2 text-left hover:bg-muted"
                    >
                      <p className="text-sm font-medium">{candidate.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{candidate.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Only registered AiCE users can be made administrators.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="adm-title">Title *</Label>
            <Input
              id="adm-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Director, Assistant Director"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="adm-signatory">Signatory name (on certificates) *</Label>
            <Input
              id="adm-signatory"
              required
              value={signatoryName}
              onChange={(e) => setSignatoryName(e.target.value)}
              placeholder="Name to print on course certificates"
            />
            <p className="text-xs text-muted-foreground">
              This is the name that appears on certificates signed by this
              administrator — not their profile name.
            </p>
          </div>

          <SignatureImagePicker
            id="adm-signature"
            label="Signature image (on certificates) *"
            file={sigFile}
            existingUrl={administrator?.signature_image ?? null}
            onFileChange={setSigFile}
            required={!isEdit}
            hint="Required when adding an administrator; leave it as-is to keep the current signature on edit."
          />

          {administratorSaveError && (
            <p className="text-sm text-red-600">{administratorSaveError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingAdministrator}>
              {isSavingAdministrator ? "Saving..." : isEdit ? "Save changes" : "Add administrator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}