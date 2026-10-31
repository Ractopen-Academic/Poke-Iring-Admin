"use client";

import { useState } from "react";
import { Calendar, Edit, Sparkles, Trash2 } from "lucide-react";
import type { GameEvent } from "../types/event.types";
import { deleteEventAction, toggleEventStatusAction } from "../services/events-actions";
import { formatDateTime } from "@/lib/utils";

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
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-neutral-800 bg-neutral-900/80 text-neutral-400 uppercase tracking-wider font-medium">
            <tr>
              <th className="px-5 py-3.5">Event</th>
              <th className="px-5 py-3.5">Type & Multiplier</th>
              <th className="px-5 py-3.5">Duration</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 text-neutral-300">
            {events.map((event) => {
              const starts = formatDateTime(event.startsAt);
              const ends = formatDateTime(event.endsAt);

              return (
                <tr key={event.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-neutral-100">{event.title}</div>
                    <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                      {event.description}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-medium text-red-400">
                        <Sparkles className="h-3 w-3" />
                        {event.multiplier}x
                      </span>
                      <span className="capitalize text-neutral-400 text-[11px]">
                        {event.eventType.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-neutral-400 whitespace-nowrap">
                    <div>{starts}</div>
                    <div className="text-[11px] text-neutral-500">&rarr; {ends}</div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={loadingId === event.id}
                      onClick={() => handleToggle(event.id, event.isActive)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                        event.isActive
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          event.isActive ? "bg-emerald-400" : "bg-neutral-500"
                        }`}
                      />
                      {event.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(event)}
                        className="rounded-md border border-neutral-800 p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={loadingId === event.id}
                        onClick={() => handleDelete(event.id, event.title)}
                        className="rounded-md border border-neutral-800 p-1.5 text-neutral-400 hover:border-red-900/50 hover:bg-red-950/30 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
