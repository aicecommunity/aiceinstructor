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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { finance } from "../../services/finance";
import type {
  FinanceMemberCandidate,
  RevenueRole,
  RevenueShare,
} from "../../types/finance";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RevenueRole[];
  share?: RevenueShare | null;
  onSaved: () => void;
}

export default function ShareFormDialog({
  open,
  onOpenChange,
  roles,
  share,
  onSaved,
}: Props) {
  const isEdit = Boolean(share);

  const [query, setQuery] = useState(share?.profile.full_name ?? "");
  const [selected, setSelected] = useState<FinanceMemberCandidate | null>(
    share
      ? {
          user_id: share.profile.user_id,
          full_name: share.profile.full_name,
          email: share.profile.email,
          username: "",
          aice_id: share.profile.aice_id,
        }
      : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<FinanceMemberCandidate[]>([]);
  const [openList, setOpenList] = useState(false);
  const [searching, setSearching] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [roleId, setRoleId] = useState<string>(share ? String(share.role.id) : "");
  const [label, setLabel] = useState(share?.label ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery(share?.profile.full_name ?? "");
    setSelected(
      share
        ? {
            user_id: share.profile.user_id,
            full_name: share.profile.full_name,
            email: share.profile.email,
            username: "",
            aice_id: share.profile.aice_id,
          }
        : null
    );
    setSearchQuery("");
    setResults([]);
    setOpenList(false);
    setRoleId(share ? String(share.role.id) : "");
    setLabel(share?.label ?? "");
    setError(null);
  }, [open, share]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await finance.memberCandidates(q);
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
    if (isEdit) return;
    setQuery(value);
    setSelected(null);
    if (!value.trim()) {
      setResults([]);
      setOpenList(false);
    }
    setSearchQuery(value);
  };

  const pickCandidate = (candidate: FinanceMemberCandidate) => {
    setSelected(candidate);
    setQuery(candidate.full_name);
    setOpenList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !selected) {
      toast.error("Search and pick the member for this share.");
      return;
    }
    if (!roleId) {
      toast.error("Pick a revenue role.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        role: Number(roleId),
        label: label.trim(),
      };
      if (isEdit) {
        await finance.updateShare(share!.id, payload);
        toast.success("Share updated");
      } else {
        await finance.createShare({
          ...payload,
          profile: selected!.user_id,
        });
        toast.success("Member added to the revenue split");
      }
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to save share.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit revenue share" : "Add a member to the split"}</DialogTitle>
          <DialogDescription>
            Adding a member just assigns them to a role — the role&apos;s percent is
            split equally among all its members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {!isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="share-pick">Member *</Label>
              <div ref={listRef} className="relative">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="share-pick"
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
                      <p className="truncate text-xs text-muted-foreground">
                        {selected.email ?? selected.aice_id}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-auto size-6"
                      onClick={() => {
                        setSelected(null);
                        setQuery("");
                      }}
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
                        <p className="truncate text-xs text-muted-foreground">
                          {candidate.email ?? candidate.aice_id}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="share-role">Role *</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger id="share-role">
                <SelectValue placeholder="Select a role…" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {roleId && (
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const role = roles.find((r) => String(r.id) === roleId);
                  if (!role) return null;
                  const count = role.member_count + (isEdit ? 0 : 1);
                  const perMember = role.percent / count;
                  return `This role is ${Number(role.percent)}% of total revenue, split equally among ${count} member${count === 1 ? "" : "s"} (≈${perMember.toFixed(2)}% each).`;
                })()}
              </p>
            )}
            {roles.length === 0 && (
              <p className="text-xs text-amber-700">
                No roles yet — create at least one role first.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="share-label">Label (optional)</Label>
            <Input
              id="share-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Growth Lead — shows instead of the member name"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || roles.length === 0}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}