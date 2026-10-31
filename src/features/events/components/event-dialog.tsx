"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { EventType, GameEvent, GameEventInput } from "../types/event.types";
import { upsertEventAction } from "../services/events-actions";
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
import { Switch } from "@/components/ui/switch";

interface EventDialogProps {
  initialEvent?: GameEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EventDialog({
  initialEvent,
  isOpen,
  onClose,
  onSaved,
}: EventDialogProps) {
  const isEditing = Boolean(initialEvent);

  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [eventType, setEventType] = useState<EventType>(initialEvent?.eventType || "double_points");
  const [multiplier, setMultiplier] = useState(initialEvent?.multiplier?.toString() || "2.0");
  const [startsAt, setStartsAt] = useState(
    initialEvent?.startsAt
      ? initialEvent.startsAt.slice(0, 16)
      : "2026-11-01T00:00"
  );
  const [endsAt, setEndsAt] = useState(
    initialEvent?.endsAt
      ? initialEvent.endsAt.slice(0, 16)
      : "2026-11-05T00:00"
  );
  const [isActive, setIsActive] = useState(initialEvent ? initialEvent.isActive : true);
  const [bannerUrl, setBannerUrl] = useState(initialEvent?.bannerUrl || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: GameEventInput = {
      ...(initialEvent?.id ? { id: initialEvent.id } : {}),
      title: title.trim(),
      description: description.trim(),
      eventType,
      multiplier: parseFloat(multiplier) || 1.0,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      isActive,
      bannerUrl: bannerUrl.trim(),
    };

    const res = await upsertEventAction(payload);
    setIsSubmitting(false);

    if (res.success) {
      onSaved();
      onClose();
    } else {
      setErrorMessage(res.error || "Failed to save event");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Game Event" : "Create New Game Event"}
          </DialogTitle>
          <DialogDescription>
            Configure limited-time multipliers and conditions displayed on the mobile game client.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekend Territory Blitz"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shown in the mobile client banner"
              className="flex w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eventType">Event Type</Label>
              <select
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="flex h-9 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
              >
                <option value="double_points">Double Points (2x)</option>
                <option value="raid">Territory Raid</option>
                <option value="seasonal">Seasonal Climax</option>
                <option value="community">Community Day</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="multiplier">Multiplier Value</Label>
              <Input
                id="multiplier"
                type="number"
                step="0.1"
                min="1.0"
                max="10.0"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startsAt">Start Time (UTC)</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endsAt">End Time (UTC)</Label>
              <Input
                id="endsAt"
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bannerUrl">Banner Image URL (Optional)</Label>
            <Input
              id="bannerUrl"
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
            <div>
              <div className="text-xs font-medium text-neutral-200">Active State</div>
              <div className="text-[11px] text-neutral-400">
                Immediately visible to active players on the mobile client.
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
