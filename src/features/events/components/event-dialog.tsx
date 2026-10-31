"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { EventType, GameEvent, GameEventInput } from "../types/event.types";
import { upsertEventAction } from "../services/events-actions";

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <h3 className="text-base font-semibold text-neutral-100">
            {isEditing ? "Edit Game Event" : "Create New Game Event"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300">Event Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekend Territory Blitz"
              className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-red-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300">Description</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a clear description shown in the mobile event banner"
              className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-red-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-red-500 focus:outline-hidden"
              >
                <option value="double_points">Double Points (2x)</option>
                <option value="raid">Territory Raid</option>
                <option value="seasonal">Seasonal Climax</option>
                <option value="community">Community Day</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300">Multiplier Value</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="10.0"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300">Start Time</label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-red-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300">End Time</label>
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300">
              Banner Image URL (Optional)
            </label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-red-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
            <div>
              <span className="text-xs font-medium text-neutral-200">Active State</span>
              <p className="text-[11px] text-neutral-400">
                Immediately visible to active players on the mobile client.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isActive ? "bg-emerald-500" : "bg-neutral-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
