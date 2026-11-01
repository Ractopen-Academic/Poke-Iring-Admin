"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { EventType, GameEvent, GameEventInput } from "../types/event.types";
import { upsertEventAction } from "../services/events-actions";
import { EventImageUploader } from "./event-image-uploader";
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

function toLocalDateTimeInput(isoString?: string, fallbackOffsetDays = 0): string {
  const parsed = isoString
    ? new Date(isoString)
    : new Date(Date.now() + fallbackOffsetDays * 86400000);
  const validDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const tzOffsetMs = validDate.getTimezoneOffset() * 60000;
  return new Date(validDate.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function argbIntToHex(argb: number, fallbackHex: string): string {
  if (!Number.isFinite(argb)) return fallbackHex;
  const rgb = (argb >>> 0) & 0xffffff;
  return `#${rgb.toString(16).padStart(6, "0")}`;
}

function hexToArgbInt(hex: string, fallbackArgb: number): number {
  const cleaned = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return fallbackArgb;
  return (0xff000000 | parseInt(cleaned, 16)) >>> 0;
}

export function EventDialog({
  initialEvent,
  isOpen,
  onClose,
  onSaved,
}: EventDialogProps) {
  const isEditing = Boolean(initialEvent);

  const [title, setTitle] = useState(initialEvent?.title || "");
  const [subtitle, setSubtitle] = useState(
    initialEvent?.subtitle || "Limited-Time Event"
  );
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [eventType, setEventType] = useState<EventType>(
    initialEvent?.eventType || "festival"
  );
  const [multiplier, setMultiplier] = useState(
    initialEvent?.multiplier?.toString() || "2.0"
  );
  const [priority, setPriority] = useState(
    initialEvent?.priority?.toString() || "10"
  );
  const [startDate, setStartDate] = useState(
    toLocalDateTimeInput(initialEvent?.startDate, 0)
  );
  const [endDate, setEndDate] = useState(
    toLocalDateTimeInput(initialEvent?.endDate, 7)
  );
  const [currencyName, setCurrencyName] = useState(
    initialEvent?.currencyName || "Moonlit Tokens"
  );
  const [currencyCode, setCurrencyCode] = useState(
    initialEvent?.currencyCode || "MLT"
  );
  const [bannerHex, setBannerHex] = useState(
    argbIntToHex(initialEvent?.bannerColorValue ?? 0xff4c1d95, "#4c1d95")
  );
  const [accentHex, setAccentHex] = useState(
    argbIntToHex(initialEvent?.accentColorValue ?? 0xfff59e0b, "#f59e0b")
  );
  const [bannerImageUrl, setBannerImageUrl] = useState(
    initialEvent?.bannerImageUrl || ""
  );
  const [logoImageUrl, setLogoImageUrl] = useState(
    initialEvent?.logoImageUrl || ""
  );
  const [partnerName, setPartnerName] = useState(
    initialEvent?.partnerName || ""
  );
  const [externalLink, setExternalLink] = useState(
    initialEvent?.externalLink || ""
  );
  const [isActive, setIsActive] = useState(
    initialEvent ? initialEvent.isActive : true
  );
  const [isFeaturedInCarousel, setIsFeaturedInCarousel] = useState(
    initialEvent ? initialEvent.isFeaturedInCarousel : true
  );
  const [showPopupOnLaunch, setShowPopupOnLaunch] = useState(
    initialEvent ? initialEvent.showPopupOnLaunch : false
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    if (
      Number.isNaN(parsedStart.getTime()) ||
      Number.isNaN(parsedEnd.getTime()) ||
      parsedEnd <= parsedStart
    ) {
      setErrorMessage("End time must be after the start time.");
      return;
    }

    setIsSubmitting(true);

    const clampedMultiplier = Math.min(
      5.0,
      Math.max(1.0, parseFloat(multiplier) || 1.0)
    );

    const payload: GameEventInput = {
      ...(initialEvent?.id ? { id: initialEvent.id } : {}),
      title: title.trim(),
      subtitle: subtitle.trim() || "Limited-Time Event",
      description: description.trim(),
      eventType,
      multiplier: clampedMultiplier,
      priority: parseInt(priority, 10) || 0,
      startDate: parsedStart.toISOString(),
      endDate: parsedEnd.toISOString(),
      isActive,
      isFeaturedInCarousel,
      showPopupOnLaunch,
      currencyName: currencyName.trim() || "Moonlit Tokens",
      currencyCode: currencyCode.trim().toUpperCase() || "MLT",
      bannerColorValue: hexToArgbInt(bannerHex, 0xff4c1d95),
      accentColorValue: hexToArgbInt(accentHex, 0xfff59e0b),
      bannerImageUrl: bannerImageUrl.trim(),
      logoImageUrl: logoImageUrl.trim(),
      partnerName: partnerName.trim() || undefined,
      externalLink: externalLink.trim() || undefined,
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
      <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Game Event" : "Create New Game Event"}
          </DialogTitle>
          <DialogDescription>
            Synchronize live festival banners, launch announcements, and Paw Points multipliers with the Flutter client.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Moonlit Strays Festival"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                required
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Exclusive Seasonal Gathering"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Displayed inside the mobile carousel card and Event Center sheet"
              className="flex w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eventType">Event Type</Label>
              <select
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="flex h-9 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
              >
                <option value="festival">Festival</option>
                <option value="partnership">Partnership</option>
                <option value="charity">Charity Drive</option>
                <option value="spotlight">Species Spotlight</option>
                <option value="double_points">Double Points</option>
                <option value="raid">Territory Raid</option>
                <option value="seasonal">Seasonal Climax</option>
                <option value="community">Community Day</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="multiplier">Points Multiplier (1x–5x)</Label>
              <Input
                id="multiplier"
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority">Sort Priority</Label>
              <Input
                id="priority"
                type="number"
                step="1"
                min="0"
                max="100"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Time (Local)</Label>
              <Input
                id="startDate"
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endDate">End Time (Local)</Label>
              <Input
                id="endDate"
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="currencyName">Event Currency Name</Label>
              <Input
                id="currencyName"
                value={currencyName}
                onChange={(e) => setCurrencyName(e.target.value)}
                placeholder="Moonlit Tokens"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currencyCode">Currency Code</Label>
              <Input
                id="currencyCode"
                maxLength={6}
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                placeholder="MLT"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bannerHex">Banner Theme Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="bannerHex"
                  type="color"
                  value={bannerHex}
                  onChange={(e) => setBannerHex(e.target.value)}
                  className="h-9 w-11 cursor-pointer rounded border border-neutral-800 bg-neutral-950 p-1"
                />
                <Input
                  value={bannerHex}
                  onChange={(e) => setBannerHex(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accentHex">Accent Badge Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="accentHex"
                  type="color"
                  value={accentHex}
                  onChange={(e) => setAccentHex(e.target.value)}
                  className="h-9 w-11 cursor-pointer rounded border border-neutral-800 bg-neutral-950 p-1"
                />
                <Input
                  value={accentHex}
                  onChange={(e) => setAccentHex(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="partnerName">Partner Organization (Optional)</Label>
              <Input
                id="partnerName"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g. Island Rescue Org (IRO)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="externalLink">External Link URL (Optional)</Label>
              <Input
                id="externalLink"
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <EventImageUploader
              id="logoImageUrl"
              kind="logo"
              label="Event / Partner Logo (Optional)"
              hint="Square emblem displayed on mobile event badges (PNG, JPG, WebP up to 2 MB)."
              value={logoImageUrl}
              onChange={setLogoImageUrl}
            />

            <EventImageUploader
              id="bannerImageUrl"
              kind="banner"
              label="Hero Banner Artwork (Optional)"
              hint="Wide cover backdrop for carousel cards and launch modals (PNG, JPG, WebP up to 5 MB)."
              value={bannerImageUrl}
              onChange={setBannerImageUrl}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
              <div>
                <div className="text-xs font-medium text-neutral-200">Active State</div>
                <div className="text-[11px] text-neutral-400">
                  Immediately visible and applying multipliers on connected mobile clients.
                </div>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
              <div>
                <div className="text-xs font-medium text-neutral-200">Feature in Home Carousel</div>
                <div className="text-[11px] text-neutral-400">
                  Display this event inside the Explorer Home sliding banner.
                </div>
              </div>
              <Switch
                checked={isFeaturedInCarousel}
                onCheckedChange={setIsFeaturedInCarousel}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
              <div>
                <div className="text-xs font-medium text-neutral-200">Show Launch Announcement Popup</div>
                <div className="text-[11px] text-neutral-400">
                  Prompt explorers with an announcement modal on app launch.
                </div>
              </div>
              <Switch
                checked={showPopupOnLaunch}
                onCheckedChange={setShowPopupOnLaunch}
              />
            </div>
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
