"use client";

import { useState } from "react";
import { Trash2, Image as ImageIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteCommunityContentAction } from "../services/moderation-actions";
import type { CommunitySightingItem, CommunityStoryItem } from "../types/moderation.types";

interface CommunityModerationTableProps {
  initialSightings: CommunitySightingItem[];
  initialStories: CommunityStoryItem[];
}

export function CommunityModerationTable({
  initialSightings,
  initialStories,
}: CommunityModerationTableProps) {
  const [activeTab, setActiveTab] = useState<"sightings" | "stories">("sightings");
  const [sightings, setSightings] = useState<CommunitySightingItem[]>(initialSightings);
  const [stories, setStories] = useState<CommunityStoryItem[]>(initialStories);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDelete = async (type: "sighting" | "story", id: string) => {
    setDeletingId(id);
    const res = await deleteCommunityContentAction(type, id);
    setDeletingId(null);

    if (res.success) {
      if (type === "sighting") {
        setSightings((prev) => prev.filter((s) => s.id !== id));
      } else {
        setStories((prev) => prev.filter((s) => s.id !== id));
      }
      setStatusMessage(`Successfully removed ${type} from public community feed.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage(res.error || `Failed to remove ${type}.`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">
            Community Uploads Moderation
          </h3>
          <p className="text-xs text-neutral-400">
            Review uploaded cat snaps and 24-hour stories. Remove unverified, non-cat, or inappropriate content.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("sightings")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              activeTab === "sightings"
                ? "bg-[#FF8C1A] text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Sightings ({sightings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stories")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              activeTab === "stories"
                ? "bg-[#FF8C1A] text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            24h Stories ({stories.length})
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-neutral-200">
          {statusMessage}
        </div>
      )}

      {activeTab === "sightings" ? (
        sightings.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-8 text-center text-xs text-neutral-400">
            No live cat sightings to moderate.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sightings.map((s) => (
              <div
                key={s.id}
                className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 space-y-2.5"
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                    {s.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-neutral-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-neutral-100 truncate">
                      {s.breed}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      By {s.actor}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-500">
                      <MapPin className="h-2.5 w-2.5" />
                      {s.barangay}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-800/80 pt-2 text-[11px]">
                  <Badge variant="outline" className="text-[10px] text-[#FF8C1A]">
                    +{s.pawPoints} pts
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deletingId === s.id}
                    onClick={() => handleDelete("sighting", s.id)}
                    className="h-7 gap-1 border-neutral-800 text-[11px] text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
                  >
                    <Trash2 className="h-3 w-3" />
                    {deletingId === s.id ? "Removing..." : "Remove"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : stories.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-8 text-center text-xs text-neutral-400">
          No 24-hour explorer stories currently uploaded.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <div
              key={story.id}
              className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 space-y-2.5"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                  {story.mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={story.mediaUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-neutral-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-neutral-100 truncate">
                    Story from {story.actor}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Uploaded {new Date(story.createdAtIso).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-neutral-800/80 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={deletingId === story.id}
                  onClick={() => handleDelete("story", story.id)}
                  className="h-7 gap-1 border-neutral-800 text-[11px] text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
                >
                  <Trash2 className="h-3 w-3" />
                  {deletingId === story.id ? "Removing..." : "Remove Story"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
