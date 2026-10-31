"use client";

import { useState } from "react";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import type { GameEvent } from "../types/event.types";
import { getEventsAction } from "../services/events-actions";
import { EventTable } from "./event-table";
import { EventDialog } from "./event-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Game Events</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Broadcast limited-time point multipliers, territory raids, and seasonal events to the mobile client.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleCreate} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Event
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-neutral-400">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-100">{events.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-emerald-400">Active Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-neutral-500">Inactive / Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-400">{inactiveCount}</div>
          </CardContent>
        </Card>
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
