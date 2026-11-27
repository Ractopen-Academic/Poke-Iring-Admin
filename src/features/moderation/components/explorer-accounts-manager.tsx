"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  Clock,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import type { ExplorerUserItem } from "../types/moderation.types";
import {
  banExplorerAction,
  suspendExplorerAction,
  unbanExplorerAction,
} from "../services/moderation-actions";
import { formatDateTime } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ExplorerAccountsManagerProps {
  initialUsers: ExplorerUserItem[];
}

export function ExplorerAccountsManager({
  initialUsers,
}: ExplorerAccountsManagerProps) {
  const [users, setUsers] = useState<ExplorerUserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended" | "banned"
  >("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<ExplorerUserItem | null>(null);
  const [dialogMode, setDialogMode] = useState<"suspend" | "ban" | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [durationHours, setDurationHours] = useState(24);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    return u.status === statusFilter;
  });

  const handleOpenSuspend = (user: ExplorerUserItem) => {
    setSelectedUser(user);
    setDialogMode("suspend");
    setReasonInput("");
    setDurationHours(24);
    setActionError(null);
  };

  const handleOpenBan = (user: ExplorerUserItem) => {
    setSelectedUser(user);
    setDialogMode("ban");
    setReasonInput("");
    setActionError(null);
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
    setDialogMode(null);
    setActionError(null);
  };

  const handleConfirmSuspend = async () => {
    if (!selectedUser) return;
    if (!reasonInput.trim()) {
      setActionError("A moderation reason is required for suspension.");
      return;
    }
    setActionLoadingId(selectedUser.id);
    setActionError(null);

    const res = await suspendExplorerAction(
      selectedUser.id,
      reasonInput.trim(),
      durationHours
    );

    setActionLoadingId(null);
    if (!res.success) {
      setActionError(res.error || "Failed to suspend explorer.");
      return;
    }

    const untilIso = new Date(
      Date.now() + durationHours * 3600 * 1000
    ).toISOString();
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              status: "suspended",
              banReason: reasonInput.trim(),
              suspendedUntilIso: untilIso,
            }
          : u
      )
    );
    handleCloseDialog();
  };

  const handleConfirmBan = async () => {
    if (!selectedUser) return;
    if (!reasonInput.trim()) {
      setActionError("A moderation reason is required for a permanent ban.");
      return;
    }
    setActionLoadingId(selectedUser.id);
    setActionError(null);

    const res = await banExplorerAction(selectedUser.id, reasonInput.trim());

    setActionLoadingId(null);
    if (!res.success) {
      setActionError(res.error || "Failed to ban explorer.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              status: "banned",
              banReason: reasonInput.trim(),
            }
          : u
      )
    );
    handleCloseDialog();
  };

  const handleReinstate = async (user: ExplorerUserItem) => {
    if (
      !confirm(
        `Are you sure you want to lift the penalty and reinstate explorer "${user.displayName || user.email}"?`
      )
    ) {
      return;
    }

    setActionLoadingId(user.id);
    setActionError(null);

    const res = await unbanExplorerAction(user.id);

    setActionLoadingId(null);
    if (!res.success) {
      alert(res.error || "Failed to reinstate explorer.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              status: "active",
              banReason: undefined,
              suspendedUntilIso: undefined,
              bannedAtIso: undefined,
              bannedBy: undefined,
            }
          : u
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search by name, email, or UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-neutral-950 border-neutral-800 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "active", "suspended", "banned"] as const).map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter)}
              className="text-xs capitalize"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Explorers Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Explorer</TableHead>
              <TableHead>Activity &amp; Points</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Moderation Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-xs text-neutral-500"
                >
                  No explorers found matching the active filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isAdmin =
                  user.role === "admin" ||
                  user.email.toLowerCase().endsWith("@iring.ph") ||
                  user.email.toLowerCase() === "admin@pokeiring.app";
                const isSuspended = user.status === "suspended";
                const isBanned = user.status === "banned";
                const isLoading = actionLoadingId === user.id;

                return (
                  <TableRow key={user.id}>
                    {/* Explorer Info */}
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 font-semibold text-xs text-neutral-300">
                          {user.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-100 text-sm truncate">
                              {user.displayName}
                            </span>
                            {isAdmin && (
                              <Badge
                                variant="outline"
                                className="border-[#FF8C1A]/40 bg-[#FF8C1A]/10 text-[#FF8C1A] text-[10px] px-1.5 py-0"
                              >
                                <Shield className="h-3 w-3 mr-1 inline" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-neutral-400 truncate">
                            {user.email || "No email on record"}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate">
                            UID: {user.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Activity */}
                    <TableCell>
                      <div className="text-xs text-neutral-300">
                        <span className="font-semibold text-neutral-100">
                          {user.totalPawPoints.toLocaleString()}
                        </span>{" "}
                        pts
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {user.totalSnaps} snaps · {user.distanceKm.toFixed(1)} km
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {isBanned ? (
                        <Badge
                          variant="destructive"
                          className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs gap-1"
                        >
                          <Ban className="h-3 w-3" />
                          Banned
                        </Badge>
                      ) : isSuspended ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs gap-1"
                        >
                          <Clock className="h-3 w-3" />
                          Suspended
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs gap-1"
                        >
                          <UserCheck className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>

                    {/* Moderation Details */}
                    <TableCell className="max-w-[200px]">
                      {isBanned ? (
                        <div className="text-xs text-red-300/90">
                          <div className="font-medium truncate">
                            {user.banReason || "Permanent ban applied"}
                          </div>
                          {user.bannedAtIso && (
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                              {formatDateTime(user.bannedAtIso)}
                            </div>
                          )}
                        </div>
                      ) : isSuspended ? (
                        <div className="text-xs text-amber-300/90">
                          <div className="font-medium truncate">
                            {user.banReason || "Temporary suspension"}
                          </div>
                          {user.suspendedUntilIso && (
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              Until: {formatDateTime(user.suspendedUntilIso)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500">In good standing</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      {isAdmin ? (
                        <Badge
                          variant="outline"
                          className="border-neutral-800 text-neutral-500 text-[11px]"
                        >
                          Protected Account
                        </Badge>
                      ) : isBanned || isSuspended ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleReinstate(user)}
                          className="gap-1.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reinstate
                        </Button>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleOpenSuspend(user)}
                            className="gap-1 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Suspend
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleOpenBan(user)}
                            className="gap-1 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Ban
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Suspend Explorer Modal */}
      <Dialog
        open={dialogMode === "suspend"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <Clock className="h-5 w-5" />
              Suspend Explorer Account
            </DialogTitle>
            <DialogDescription>
              Temporarily revoke app access for{" "}
              <strong className="text-neutral-200">
                {selectedUser?.displayName || selectedUser?.email}
              </strong>
              . Their active sessions and Firebase tokens will be immediately terminated.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {actionError}
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="suspend-duration">Suspension Duration</Label>
              <select
                id="suspend-duration"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:outline-hidden"
              >
                <option value={24}>24 Hours (1 Day)</option>
                <option value={72}>72 Hours (3 Days)</option>
                <option value={168}>7 Days (1 Week)</option>
                <option value={720}>30 Days (1 Month)</option>
                <option value={2160}>90 Days (3 Months)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="suspend-reason">Moderation Reason (Required)</Label>
              <textarea
                id="suspend-reason"
                rows={3}
                required
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="e.g. Inappropriate story submission or repeated GPS spoofing."
                className="w-full rounded-md border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-hidden"
              />
              <p className="text-[11px] text-neutral-500">
                This notice will be visible on the explorer&#39;s mobile lockout screen.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={Boolean(actionLoadingId)}
              onClick={handleConfirmSuspend}
              className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5"
            >
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Ban Modal */}
      <Dialog
        open={dialogMode === "ban"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="sm:max-w-md border-red-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="h-5 w-5" />
              Permanent Account Ban
            </DialogTitle>
            <DialogDescription>
              Permanently lock explorer{" "}
              <strong className="text-neutral-200">
                {selectedUser?.displayName || selectedUser?.email}
              </strong>
              . The explorer will be blocked from logging in, scanning cats, booping, or viewing live barangay maps.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {actionError}
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ban-reason">Expulsion Justification (Required)</Label>
              <textarea
                id="ban-reason"
                rows={3}
                required
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="e.g. Malicious conduct, severe harassment, or persistent terms violation."
                className="w-full rounded-md border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-hidden"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={Boolean(actionLoadingId)}
              onClick={handleConfirmBan}
              className="bg-red-600 hover:bg-red-500 text-white gap-1.5"
            >
              Confirm Permanent Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
