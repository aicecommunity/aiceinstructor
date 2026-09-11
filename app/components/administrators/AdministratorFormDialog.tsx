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
import { administrators as administratorsService } from "../../services/administrators";
import { useAdministratorStore } from "../../store/useAdministratorStore";
import { useTitleStore } from "../../store/useTitleStore";
import SignatureImagePicker from "../shared/SignatureImagePicker";
import type { Administrator, AdministratorCandidate, AdministratorPayload } from "../../types/course";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  administrator?: Administrator | null;
}

function candidateFromAdministrator(admin: Administrator): AdministratorCandidate | null {
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
  const { titles: titleOptions, fetchTitles } = useTitleStore();

  const [query, setQuery] = useState(administrator?.name ?? "");
  const [selected, setSelected] = useState<AdministratorCandidate | null>(
    administrator ? candidateFromAdministrator(administrator) : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<AdministratorCandidate[]>([]);
  const [openList, setOpenList] = useState(false);
  const [searching, setSearching] = useState(false);
  const [titleId, setTitleId] = useState<number | null>(administrator?.title ?? null);
  const [signatoryName, setSignatoryName] = useState(administrator?.signatory_name ?? "");
  const [sigFile, setSigFile] = useState<File | null>(null);
  // Signature coming from the person's current instructor entry (not re-uploaded).
  const [carriedSignature, setCarriedSignature] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const isEdit = Boolean(administrator);

  useEffect(() => {
    if (!open) return;
    fetchTitles();
    setQuery(administrator?.name ?? "");
    setSelected(administrator ? candidateFromAdministrator(administrator) : null);
    setTitleId(administrator?.title ?? null);
    setSignatoryName(administrator?.signatory_name ?? "");
    setSigFile(null);
    setCarriedSignature(null);
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
        const { data } = await administratorsService.searchCandidates(q);
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
    if (isEdit) return; // the linked user can't be changed on edit
    setQuery(value);
    setSelected(null);
    setCarriedSignature(null);
    if (!value.trim()) {
      setResults([]);
      setOpenList(false);
    }
    setSearchQuery(value);
  };

  const pickCandidate = (candidate: AdministratorCandidate) => {
    setSelected(candidate);
    setQuery(candidate.full_name);
    setOpenList(false);
    // When the person is currently an instructor, carry their signatory name
    // and signature over so neither has to be re-entered on the move to
    // Administrators.
    if (candidate.signatory_name) {
      setSignatoryName(candidate.signatory_name);
    }
    setCarriedSignature(candidate.signature_image ?? null);
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery("");
    setCarriedSignature(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selected) {
      toast.error("Search and pick a registered user for this administrator.");
      return;
    }
    if (!titleId) {
      toast.error("Select a title for this administrator.");
      return;
    }
    if (!signatoryName.trim()) {
      toast.error("Signatory name is required.");
      return;
    }
    if (!sigFile && !carriedSignature && !isEdit) {
      toast.error("Upload the administrator's signature image.");
      return;
    }

    const payload: AdministratorPayload = {
      profile_id: selected.user_id,
      title: titleId,
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
                    if (!isEdit && !selected && results.length > 0) setOpenList(true);
                  }}
                  placeholder="Search name or email…"
                  autoComplete="off"
                  disabled={isEdit}
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
                  {!isEdit && (
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
                  )}
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
              {isEdit
                ? "The user this administrator is linked to cannot be changed."
                : "Only registered AiCE users can be made administrators. If the person is currently an instructor, adding them here moves them from the Instructors list (a person can only be in one registry)."}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="adm-title">Title *</Label>
            <Select
              value={titleId?.toString() ?? ""}
              onValueChange={(val) => setTitleId(Number(val))}
            >
              <SelectTrigger className="w-full" id="adm-title">
                <SelectValue placeholder="Select a title" />
              </SelectTrigger>
              <SelectContent>
                {titleOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Titles are defined in the Titles page (superuser only).
            </p>
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
            existingUrl={administrator?.signature_image ?? carriedSignature ?? null}
            onFileChange={setSigFile}
            required={!isEdit && !carriedSignature}
            hint={
              carriedSignature
                ? "Carried over from the person's instructor entry — no upload needed. Pick a file to replace it."
                : "Required when adding an administrator; leave it as-is to keep the current signature on edit."
            }
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