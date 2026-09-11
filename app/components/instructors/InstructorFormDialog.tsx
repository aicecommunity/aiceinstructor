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
import { useInstructorStore } from "../../store/useInstructorStore";
import SignatureImagePicker from "../shared/SignatureImagePicker";
import type { Instructor, InstructorCandidate, InstructorPayload } from "../../types/course";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor?: Instructor | null;
}

function candidateFromInstructor(ins: Instructor): InstructorCandidate | null {
  if (ins.profile_id == null || !ins.email) return null;
  return {
    user_id: ins.profile_id,
    full_name: ins.name,
    email: ins.email,
    username: "",
  };
}

export default function InstructorFormDialog({
  open,
  onOpenChange,
  instructor,
}: Props) {
  const { createInstructor, updateInstructor, isSavingInstructor, instructorSaveError } =
    useInstructorStore();

  const [query, setQuery] = useState(instructor?.name ?? "");
  const [selected, setSelected] = useState<InstructorCandidate | null>(
    instructor ? candidateFromInstructor(instructor) : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [signatoryName, setSignatoryName] = useState(instructor?.signatory_name ?? "");
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [results, setResults] = useState<InstructorCandidate[]>([]);
  const [openList, setOpenList] = useState(false);
  const [searching, setSearching] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const isEdit = Boolean(instructor);

  // Debounced search while the superuser types a name/email. Only the timer/async
  // callbacks touch state, so the search is kicked off from `handleQueryChange`.
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
    if (isEdit) return; // the linked user can't be changed on edit
    setQuery(value);
    setSelected(null); // typing a new search overrides the current pick
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
      toast.error("Search and pick a registered user for this instructor.");
      return;
    }

    const payload: InstructorPayload = {
      profile_id: selected.user_id,
      // Title is no longer captured for instructors.
      signatory_name: signatoryName.trim(),
      // Only send a signature when a new one was picked — omitting it on edit
      // keeps the existing image on the backend (sending null would wipe it).
      ...(sigFile ? { signature_image: sigFile } : {}),
    };

    if (!payload.signatory_name) {
      toast.error("Signatory name is required.");
      return;
    }
    if (!isEdit && !sigFile) {
      toast.error("Upload the instructor's signature image.");
      return;
    }

    const saved = isEdit
      ? await updateInstructor(instructor!.id, payload)
      : await createInstructor(payload);

    if (saved) {
      toast.success(isEdit ? "Instructor updated" : "Instructor created");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit instructor" : "Add instructor"}</DialogTitle>
          <DialogDescription>
            The instructor must be an existing user — search by name or email to
            pick their account (live /api/courses/instructors/).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ins-pick">Instructor *</Label>
            <div ref={listRef} className="relative">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ins-pick"
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
                    <p className="truncate text-xs text-muted-foreground">
                      {selected.email}
                    </p>
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
                      <p className="truncate text-xs text-muted-foreground">
                        {candidate.email}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? "The user this instructor is linked to cannot be changed."
                : "Only registered AiCE users can be made instructors."}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ins-signatory">Signatory name (on certificates) *</Label>
            <Input
              id="ins-signatory"
              required
              value={signatoryName}
              onChange={(e) => setSignatoryName(e.target.value)}
              placeholder="Name to print on course certificates"
            />
            <p className="text-xs text-muted-foreground">
              This is the name that appears on certificates signed by this
              instructor — not their profile name.
            </p>
          </div>

          <SignatureImagePicker
            id="ins-signature"
            label="Signature image (on certificates) *"
            file={sigFile}
            existingUrl={instructor?.signature_image ?? null}
            onFileChange={setSigFile}
            required={!isEdit}
            hint="Required when adding an instructor; leave it as-is to keep the current signature on edit."
          />

          {instructorSaveError && (
            <p className="text-sm text-red-600">{instructorSaveError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingInstructor}>
              {isSavingInstructor ? "Saving..." : isEdit ? "Save changes" : "Add instructor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}