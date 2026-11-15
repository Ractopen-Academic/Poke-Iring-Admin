"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  MapPin,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import type {
  CommunitySightingItem,
  CommunityStoryItem,
  ExplorerAuditLogItem,
  ExplorerUserItem,
} from "../types/moderation.types";
import {
  banExplorerAction,
  deleteCommunityContentAction,
  suspendExplorerAction,
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

interface AuditTrailViewerProps {
  initialLogs: ExplorerAuditLogItem[];
  users: ExplorerUserItem[];
}

export function AuditTrailViewer({
  initialLogs,
  users,
}: AuditTrailViewerProps) {
  const [logs, setLogs] = useState<ExplorerAuditLogItem[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "suspicious" | "sighting" | "story" | "admin" | "user"
  >("all");
  const [severityFilter, setSeverityFilter] = useState<
    "all" | "flagged_only"
  >("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Quick moderation modal states
  const [quickTargetUser, setQuickTargetUser] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [quickMode, setQuickMode] = useState<"suspend" | "ban" | null>(null);
  const [quickReason, setQuickReason] = useState("");
  const [quickDurationHours, setQuickDurationHours] = useState(24);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      (log.actorEmail &&
        log.actorEmail.toLowerCase().includes(search.toLowerCase())) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.summary.toLowerCase().includes(search.toLowerCase()) ||
      (log.flagReason &&
        log.flagReason.toLowerCase().includes(search.toLowerCase())) ||
      log.actorId.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter !== "all" && log.category !== categoryFilter) {
      return false;
    }

    if (severityFilter === "flagged_only" && log.severity === "info") {
      return false;
    }

    return true;
  });

  const handleDeleteContent = async (
    type: "sighting" | "story",
    contentId: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to remove this ${type} from the community feed?`
      )
    ) {
      return;
    }

    setActionLoadingId(contentId);
    const res = await deleteCommunityContentAction(type, contentId);
    setActionLoadingId(null);

    if (res.success) {
      setLogs((prev) => prev.filter((l) => l.targetId !== contentId));
      setStatusMessage(`Successfully removed ${type} from the database.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage(res.error || `Failed to remove ${type}.`);
    }
  };

  const handleOpenQuickModerate = (
    actorId: string,
    actorName: string,
    mode: "suspend" | "ban",
    defaultReason?: string
  ) => {
    setQuickTargetUser({ id: actorId, displayName: actorName });
    setQuickMode(mode);
    setQuickReason(
      defaultReason ? `Moderation flag: ${defaultReason}` : ""
    );
    setQuickDurationHours(24);
  };

  const handleConfirmQuickSuspend = async () => {
    if (!quickTargetUser) return;
    if (!quickReason.trim()) {
      setStatusMessage("A moderation reason is required.");
      return;
    }
    setActionLoadingId(quickTargetUser.id);
    const res = await suspendExplorerAction(
      quickTargetUser.id,
      quickReason.trim(),
      quickDurationHours
    );
    setActionLoadingId(null);

    if (res.success) {
      setQuickTargetUser(null);
      setQuickMode(null);
      setStatusMessage(
        `Suspended explorer ${quickTargetUser.displayName} for ${quickDurationHours} hours.`
      );
      setTimeout(() => setStatusMessage(null), 3500);
    } else {
      setStatusMessage(res.error || "Failed to suspend explorer.");
    }
  };

  const handleConfirmQuickBan = async () => {
    if (!quickTargetUser) return;
    if (!quickReason.trim()) {
      setStatusMessage("An expulsion reason is required.");
      return;
    }
    setActionLoadingId(quickTargetUser.id);
    const res = await banExplorerAction(
      quickTargetUser.id,
      quickReason.trim()
    );
    setActionLoadingId(null);

    if (res.success) {
      setQuickTargetUser(null);
      setQuickMode(null);
      setStatusMessage(
        `Permanently banned explorer ${quickTargetUser.displayName}.`
      );
      setTimeout(() => setStatusMessage(null), 3500);
    } else {
      setStatusMessage(res.error || "Failed to ban explorer.");
    }
  };

  const handleExportCsv = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows: string[] = [];

    rows.push("POKE: IRING EXPLORER AUDIT & ACTIVITY LOG");
    rows.push(`Exported At,${new Date().toISOString()}`);
    rows.push("");
    rows.push("Timestamp,Severity,Category,Action,Actor Name,Actor Email,Actor UID,Summary,Flag Reason");

    for (const log of filteredLogs) {
      const cleanActor = log.actorName.replace(/"/g, '""');
      const cleanEmail = (log.actorEmail || "").replace(/"/g, '""');
      const cleanAction = log.action.replace(/"/g, '""');
      const cleanSummary = log.summary.replace(/"/g, '""');
      const cleanFlag = (log.flagReason || "").replace(/"/g, '""');
      rows.push(
        `"${log.timestampIso}","${log.severity}","${log.category}","${cleanAction}","${cleanActor}","${cleanEmail}","${log.actorId}","${cleanSummary}","${cleanFlag}"`
      );
    }

    const csvContent = rows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pokeiring-audit-trail-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search audit trail by actor, action, reason, UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-neutral-950 border-neutral-800 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs gap-1.5 border-neutral-800 hover:bg-neutral-800"
          >
            <Download className="h-3.5 w-3.5" />
            Export Audit CSV
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-neutral-400 mr-1 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Filter:
        </span>
        {(
          [
            { id: "all", label: "All Events" },
            { id: "suspicious", label: "Suspicious & Alerts" },
            { id: "sighting", label: "Sightings" },
            { id: "story", label: "24h Stories" },
            { id: "admin", label: "Admin Actions" },
          ] as const
        ).map((tab) => (
          <Button
            key={tab.id}
            variant={categoryFilter === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(tab.id)}
            className="text-xs h-7 px-2.5"
          >
            {tab.label}
          </Button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={severityFilter === "flagged_only" ? "destructive" : "outline"}
            size="sm"
            onClick={() =>
              setSeverityFilter((prev) =>
                prev === "flagged_only" ? "all" : "flagged_only"
              )
            }
            className="text-xs h-7 gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            {severityFilter === "flagged_only" ? "Show All Severities" : "Only Flagged/Alerts"}
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-neutral-200">
          {statusMessage}
        </div>
      )}

      {/* Audit Log Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Timestamp</TableHead>
              <TableHead className="w-[110px]">Severity</TableHead>
              <TableHead className="w-[180px]">Action &amp; Category</TableHead>
              <TableHead className="w-[180px]">Explorer / Actor</TableHead>
              <TableHead>Audit Summary &amp; Details</TableHead>
              <TableHead className="text-right w-[140px]">Intervention</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-xs text-neutral-500"
                >
                  No explorer activity records match the current filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const isDanger = log.severity === "danger";
                const isWarning = log.severity === "warning";
                const hasPhoto = Boolean(log.photoUrl);
                const isContent =
                  log.category === "sighting" || log.category === "story";
                const isActorAdmin =
                  log.actorEmail?.toLowerCase().endsWith("@iring.ph") ||
                  log.actorName === "admin@iring.ph";

                return (
                  <TableRow
                    key={log.id}
                    className={
                      isDanger
                        ? "bg-red-500/5 hover:bg-red-500/10"
                        : isWarning
                          ? "bg-amber-500/5 hover:bg-amber-500/10"
                          : undefined
                    }
                  >
                    {/* Timestamp */}
                    <TableCell className="text-[11px] text-neutral-400 font-mono whitespace-nowrap">
                      {formatDateTime(log.timestampIso)}
                    </TableCell>

                    {/* Severity */}
                    <TableCell>
                      {isDanger ? (
                        <Badge
                          variant="destructive"
                          className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] gap-1 px-1.5"
                        >
                          <ShieldAlert className="h-3 w-3" />
                          Alert
                        </Badge>
                      ) : isWarning ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] gap-1 px-1.5"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Flagged
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-neutral-800 text-neutral-400 border-neutral-700 text-[10px] px-1.5"
                        >
                          Normal
                        </Badge>
                      )}
                    </TableCell>

                    {/* Action & Category */}
                    <TableCell>
                      <div className="font-semibold text-xs text-neutral-200">
                        {log.action}
                      </div>
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono mt-0.5">
                        {log.category}
                      </div>
                    </TableCell>

                    {/* Explorer / Actor */}
                    <TableCell>
                      <div className="font-medium text-xs text-neutral-200 truncate max-w-[170px]">
                        {log.actorName}
                      </div>
                      {log.actorEmail && (
                        <div className="text-[11px] text-neutral-400 truncate max-w-[170px]">
                          {log.actorEmail}
                        </div>
                      )}
                      <div className="text-[10px] text-neutral-500 font-mono truncate max-w-[170px]">
                        {log.actorId}
                      </div>
                    </TableCell>

                    {/* Details */}
                    <TableCell>
                      <div className="flex items-start gap-3">
                        {hasPhoto && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={log.photoUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-md border border-neutral-800 object-cover bg-neutral-950"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs text-neutral-300">
                            {log.summary}
                          </div>
                          {log.flagReason && (
                            <div className="text-[11px] font-medium text-red-400 mt-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>{log.flagReason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isContent && log.targetId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoadingId === log.targetId}
                            onClick={() =>
                              handleDeleteContent(
                                log.category === "story" ? "story" : "sighting",
                                log.targetId!
                              )
                            }
                            title="Delete content"
                            className="h-7 w-7 p-0 text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {!isActorAdmin && log.actorId && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleOpenQuickModerate(
                                  log.actorId,
                                  log.actorName,
                                  "suspend",
                                  log.flagReason || log.summary
                                )
                              }
                              title="Suspend explorer"
                              className="h-7 px-2 text-xs text-amber-400 hover:bg-amber-500/10"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Suspend
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleOpenQuickModerate(
                                  log.actorId,
                                  log.actorName,
                                  "ban",
                                  log.flagReason || log.summary
                                )
                              }
                              title="Ban explorer"
                              className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Ban
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Quick Suspend Modal */}
      <Dialog
        open={quickMode === "suspend"}
        onOpenChange={(open) => !open && setQuickMode(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <Clock className="h-5 w-5" />
              Suspend Explorer: {quickTargetUser?.displayName}
            </DialogTitle>
            <DialogDescription>
              Temporarily revoke app access for explorer UID{" "}
              <code className="text-neutral-300 font-mono text-xs">
                {quickTargetUser?.id}
              </code>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="quick-duration">Suspension Duration</Label>
              <select
                id="quick-duration"
                value={quickDurationHours}
                onChange={(e) => setQuickDurationHours(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:outline-hidden"
              >
                <option value={24}>24 Hours (1 Day)</option>
                <option value={72}>72 Hours (3 Days)</option>
                <option value={168}>7 Days (1 Week)</option>
                <option value={720}>30 Days (1 Month)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick-reason">Moderation Justification</Label>
              <textarea
                id="quick-reason"
                rows={3}
                required
                value={quickReason}
                onChange={(e) => setQuickReason(e.target.value)}
                placeholder="Explain the bad activity or terms violation..."
                className="w-full rounded-md border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-hidden"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickMode(null)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={Boolean(actionLoadingId)}
              onClick={handleConfirmQuickSuspend}
              className="bg-amber-600 hover:bg-amber-500 text-white"
            >
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Ban Modal */}
      <Dialog
        open={quickMode === "ban"}
        onOpenChange={(open) => !open && setQuickMode(null)}
      >
        <DialogContent className="sm:max-w-md border-red-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="h-5 w-5" />
              Ban Explorer: {quickTargetUser?.displayName}
            </DialogTitle>
            <DialogDescription>
              Permanently expel explorer UID{" "}
              <code className="text-neutral-300 font-mono text-xs">
                {quickTargetUser?.id}
              </code>
              . They will be locked out from Poke: Iring immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="quick-ban-reason">Expulsion Justification</Label>
              <textarea
                id="quick-ban-reason"
                rows={3}
                required
                value={quickReason}
                onChange={(e) => setQuickReason(e.target.value)}
                placeholder="Explain the critical violation or malicious conduct..."
                className="w-full rounded-md border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-hidden"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickMode(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={Boolean(actionLoadingId)}
              onClick={handleConfirmQuickBan}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Confirm Permanent Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
