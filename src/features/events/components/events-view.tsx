"use client";

import { useState } from "react";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import type { GameEvent } from "../types/event.types";
import { getEventsAction } from "../services/events-actions";
import { EventTable } from "./event-table";
import { EventDialog } from "./event-dialog";

interface EventsViewProps {
  initialEvents: GameEvent[];
  isConfigured: boolean;
  initialError?: string;
}

export function EventsView({
  initialEvents,
  isConfigured,
  initialError,
}: EventsViewProps) {
  const [events, setEvents] = useState<GameEvent[]>(initialEvents);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);

  async function handleRefresh() {
    setIsRefreshing(true);
    const res = await getEventsAction();
    setEvents(res.data);
    setIsRefreshing(false);
  }

  function handleCreate() {
    setSelectedEvent(null);
    setIsDialogOpen(true);
  }

  function handleEdit(event: GameEvent) {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  }

  const activeCount = events.filter((e) => e.isActive).length;
  const inactiveCount = events.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Configuration Status Notice */}
      {!isConfigured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Firebase Admin Credentials Not Found
          </div>
          <p className="mt-1 text-neutral-400">
            Currently running in demonstration mode. To sync live modifications to Cloud Firestore,
            provide your service account credentials in <code className="text-amber-200">.env.local</code>.
          </p>
        </div>
      )}

      {initialError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
          {initialError}
        </div>
      )}

      {/* Header and Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Game Events</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Broadcast limited-time point multipliers, territory raids, and seasonal events to the mobile client.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-500"
          >
            <Plus className="h-3.5 w-3.5" />
            New Event
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <div className="text-xs text-neutral-400 font-medium">Total Events</div>
          <div className="text-2xl font-bold mt-1 text-neutral-100">{events.length}</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <div className="text-xs text-emerald-400 font-medium">Active Events</div>
          <div className="text-2xl font-bold mt-1 text-emerald-400">{activeCount}</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <div className="text-xs text-neutral-500 font-medium">Inactive / Draft</div>
          <div className="text-2xl font-bold mt-1 text-neutral-400">{inactiveCount}</div>
        </div>
      </div>

      {/* Table */}
      <EventTable events={events} onEdit={handleEdit} onRefresh={handleRefresh} />

      {/* Modal Dialog */}
      {isDialogOpen && (
        <EventDialog
          key={selectedEvent?.id || "new"}
          isOpen={isDialogOpen}
          initialEvent={selectedEvent}
          onClose={() => setIsDialogOpen(false)}
          onSaved={handleRefresh}
        />
      )}
    </div>
  );
}
