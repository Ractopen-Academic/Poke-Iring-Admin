"use client";

import { useState } from "react";
import { Calendar, Edit, Sparkles, Trash2 } from "lucide-react";
import type { GameEvent } from "../types/event.types";
import { deleteEventAction, toggleEventStatusAction } from "../services/events-actions";
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

interface EventTableProps {
  events: GameEvent[];
  onEdit: (event: GameEvent) => void;
  onRefresh: () => void;
}

export function EventTable({ events, onEdit, onRefresh }: EventTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggle(id: string, currentStatus: boolean) {
    setLoadingId(id);
    await toggleEventStatusAction(id, !currentStatus);
    setLoadingId(null);
    onRefresh();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete event "${title}"?`)) return;
    setLoadingId(id);
    await deleteEventAction(id);
    setLoadingId(null);
    onRefresh();
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
        <Calendar className="mx-auto h-8 w-8 text-neutral-600" />
        <h4 className="mt-3 text-sm font-semibold text-neutral-200">No events found</h4>
        <p className="mt-1 text-xs text-neutral-400">
          Create a live event to push double-point multipliers or raid conditions to the Flutter app.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Type & Multiplier</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const starts = formatDateTime(event.startsAt);
            const ends = formatDateTime(event.endsAt);

            return (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="font-semibold text-neutral-100">{event.title}</div>
                  <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                    {event.description}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="gap-1 font-mono">
                      <Sparkles className="h-3 w-3" />
                      {event.multiplier}x
                    </Badge>
                    <span className="capitalize text-neutral-400 text-[11px]">
                      {event.eventType.replace("_", " ")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-neutral-400 whitespace-nowrap">
                  <div>{starts}</div>
                  <div className="text-[11px] text-neutral-500">&rarr; {ends}</div>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant={event.isActive ? "outline" : "secondary"}
                    size="sm"
                    disabled={loadingId === event.id}
                    onClick={() => handleToggle(event.id, event.isActive)}
                    className={`gap-1.5 text-[11px] h-7 px-2.5 rounded-full ${
                      event.isActive
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : "text-neutral-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        event.isActive ? "bg-emerald-400" : "bg-neutral-500"
                      }`}
                    />
                    {event.isActive ? "Active" : "Disabled"}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(event)}
                      className="h-8 w-8 text-neutral-400 hover:text-white"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={loadingId === event.id}
                      onClick={() => handleDelete(event.id, event.title)}
                      className="h-8 w-8 text-neutral-400 hover:bg-red-950/40 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
