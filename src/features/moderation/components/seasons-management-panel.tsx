"use client";

import { useState } from "react";
import { RotateCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { triggerSeasonRolloverAction } from "../services/moderation-actions";
import type { ActiveSeasonData } from "../types/moderation.types";

interface SeasonsManagementPanelProps {
  initialSeason: ActiveSeasonData;
}

export function SeasonsManagementPanel({ initialSeason }: SeasonsManagementPanelProps) {
  const [season, setSeason] = useState<ActiveSeasonData>(initialSeason);
  const [isRolloverPending, setIsRolloverPending] = useState(false);
  const [confirmRollover, setConfirmRollover] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRollover = async () => {
    setIsRolloverPending(true);
    setStatusMessage(null);

    const res = await triggerSeasonRolloverAction();
    setIsRolloverPending(false);
    setConfirmRollover(false);

    if (res.success && res.newSeasonNumber) {
      setSeason({
        ...season,
        number: res.newSeasonNumber,
        title: `Season ${res.newSeasonNumber}: Whispering Calico`,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        status: "active",
      });
      setStatusMessage(
        `Prestige season rollover complete. Season ${res.newSeasonNumber} is now live.`
      );
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage(res.error || "Failed to trigger season rollover.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">
            Active Season Clock &amp; Prestige Rollover
          </h3>
          <p className="text-xs text-neutral-400">
            Manage global competitive ranked windows, prestige milestones, and season transitions.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-neutral-200">
          {statusMessage}
        </div>
      )}

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF8C1A]/15 border border-[#FF8C1A]/30 text-[#FF8C1A]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-neutral-100">
                  {season.title}
                </span>
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px]"
                >
                  Season #{season.number} Active
                </Badge>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                {season.description || "Active ranked feline expedition season."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs text-neutral-400 sm:text-right font-mono">
            <div>Starts: {new Date(season.startsAt).toLocaleDateString()}</div>
            <div>Ends: {new Date(season.endsAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="border-t border-neutral-800/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-neutral-400">
            Triggering rollover archives the current season document and increments the global season rank for all connected mobile players.
          </div>

          {confirmRollover ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmRollover(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isRolloverPending}
                onClick={handleRollover}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
              >
                <RotateCw className={`h-3 w-3 ${isRolloverPending ? "animate-spin" : ""}`} />
                {isRolloverPending ? "Rolling over..." : "Confirm Season Rollover"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRollover(true)}
              className="gap-1.5 border-neutral-800 text-xs text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/40"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Trigger Season Rollover
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
