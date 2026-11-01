"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { DatabasePurgeScope } from "@/lib/security/validators";
import type { DatabaseOverview } from "../types/database.types";
import {
  populateBaselineDatabaseAction,
  purgeDatabaseScopeAction,
} from "../services/database-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface DatabaseDryRunViewProps {
  initialOverview: DatabaseOverview;
}

const PURGE_OPTIONS: Array<{
  scope: DatabasePurgeScope;
  title: string;
  subtitle: string;
  recommended?: boolean;
}> = [
  {
    scope: "full_dry_run_reset",
    title: "Full Deployment Dry-Run Reset",
    subtitle:
      "Purges all mock/bot records, clears test sightings & 24h stories, resets real explorer scores to 0, and seeds all canonical catalogs + Calico starter events.",
    recommended: true,
  },
  {
    scope: "mock_only",
    title: "Purge Mock & Demo Records Only",
    subtitle:
      "Deletes known seed/bot accounts (MactanBoss, TokyoNekoMaster, dev-user-*, seed-*) and legacy purple/teal demo events while keeping real player progress intact.",
  },
  {
    scope: "player_activity",
    title: "Reset Player Activity & Scores",
    subtitle:
      "Clears sightings and 24h stories and resets real explorer Paw Points, Prestige, and quest counters back to 0 without altering events or catalogs.",
  },
  {
    scope: "all_events",
    title: "Clear All Events",
    subtitle:
      "Removes every document in the events collection so you can author fresh campaigns from the Event Studio.",
  },
];

export function DatabaseDryRunView({
  initialOverview,
}: DatabaseDryRunViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [seedConfigAndSeason, setSeedConfigAndSeason] = useState(true);
  const [seedTerritories, setSeedTerritories] = useState(true);
  const [seedQuests, setSeedQuests] = useState(true);
  const [seedDexAndAchievements, setSeedDexAndAchievements] = useState(true);
  const [seedCalicoStarterEvents, setSeedCalicoStarterEvents] = useState(true);

  const [selectedScope, setSelectedScope] =
    useState<DatabasePurgeScope>("full_dry_run_reset");
  const [confirmPhrase, setConfirmPhrase] = useState("");

  const [isPopulating, setIsPopulating] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function handlePopulateBaseline() {
    setStatusBanner(null);
    setIsPopulating(true);
    const res = await populateBaselineDatabaseAction({
      seedConfigAndSeason,
      seedTerritories,
      seedQuests,
      seedDexAndAchievements,
      seedCalicoStarterEvents,
    });
    setIsPopulating(false);

    if (res.success && res.data) {
      setStatusBanner({
        tone: "success",
        message: res.data.summary,
      });
      router.refresh();
    } else {
      setStatusBanner({
        tone: "error",
        message: res.error || "Failed to populate baseline collections.",
      });
    }
  }

  async function handleExecutePurge(e: React.FormEvent) {
    e.preventDefault();
    setStatusBanner(null);
    setIsPurging(true);
    const res = await purgeDatabaseScopeAction({
      scope: selectedScope,
      confirmPhrase,
    });
    setIsPurging(false);

    if (res.success && res.data) {
      setConfirmPhrase("");
      setStatusBanner({
        tone: "success",
        message: res.data.summary,
      });
      router.refresh();
    } else {
      setStatusBanner({
        tone: "error",
        message: res.error || "Database purge operation failed.",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-neutral-800/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Database &amp; Deployment Dry-Run
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Purge development mock records, reset test activity, and populate canonical Firestore collections for production or dry-run testing.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="gap-1.5"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
          />
          Re-scan Firestore
        </Button>
      </div>

      {/* Credentials Warning if Offline */}
      {!initialOverview.isConfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-100">
              Firebase Admin SDK Credentials Not Detected
            </div>
            <p className="mt-0.5 text-amber-200/80">
              Configure <code className="font-mono">FIREBASE_ADMIN_PROJECT_ID</code>,{" "}
              <code className="font-mono">FIREBASE_ADMIN_CLIENT_EMAIL</code>, and{" "}
              <code className="font-mono">FIREBASE_ADMIN_PRIVATE_KEY</code> in your Vercel or local environment to execute live Firestore dry-run operations.
            </p>
          </div>
        </div>
      )}

      {/* Operation Feedback Banner */}
      {statusBanner && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
            statusBanner.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {statusBanner.tone === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          )}
          <span className="leading-relaxed">{statusBanner.message}</span>
        </div>
      )}

      {/* Readiness Banner */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-neutral-400">
              Deployment Readiness
            </CardTitle>
            <ShieldCheck
              className={`h-4 w-4 ${
                initialOverview.isDeploymentReady
                  ? "text-emerald-400"
                  : "text-[#FF8C1A]"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-neutral-100">
              {initialOverview.isDeploymentReady
                ? "Ready for Dry Run"
                : "Action Recommended"}
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              {initialOverview.isDeploymentReady
                ? "Zero mock records and all baseline catalogs populated."
                : "Seed missing catalogs or purge remaining mock records below."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-neutral-400">
              Detected Mock / Bot Records
            </CardTitle>
            <Trash2 className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-neutral-100">
              {initialOverview.totalMockRecords} Record
              {initialOverview.totalMockRecords === 1 ? "" : "s"}
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              Scanned across users, sightings, stories, and legacy demo events.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-neutral-400">
              Canonical Catalogs
            </CardTitle>
            <Layers className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-neutral-100">
              {6 - initialOverview.missingBaselineCollections.length} / 6 Ready
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              {initialOverview.missingBaselineCollections.length === 0
                ? "Config, Season, Territories, Quests, Dex, and Achievements synced."
                : `Missing: ${initialOverview.missingBaselineCollections.join(", ")}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Grid: Populate vs Purge */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Baseline Seeder */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Database className="h-4 w-4 text-[#FF8C1A]" />
                Populate Deployment Baseline
              </CardTitle>
              <CardDescription>
                Idempotently writes the exact canonical datasets required by Poke: Iring v0.33.0 without deleting real user accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                <div>
                  <div className="text-xs font-medium text-neutral-200">
                    Global App Config &amp; Season 1 Window
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Writes <code className="font-mono">app_config/global</code> (v0.33.0) and active 30-day{" "}
                    <code className="font-mono">seasons/active_season</code>.
                  </div>
                </div>
                <Switch
                  checked={seedConfigAndSeason}
                  onCheckedChange={setSeedConfigAndSeason}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                <div>
                  <div className="text-xs font-medium text-neutral-200">
                    Philippine Cities &amp; Barangays (14 Cities)
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Populates <code className="font-mono">territories</code> across Cebu, Metro Manila, Luzon, Visayas, and Mindanao.
                  </div>
                </div>
                <Switch
                  checked={seedTerritories}
                  onCheckedChange={setSeedTerritories}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                <div>
                  <div className="text-xs font-medium text-neutral-200">
                    Paw Quest Pool (15 Templates)
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Populates daily and weekly movement, sighting, and boop quests in{" "}
                    <code className="font-mono">quest_templates</code>.
                  </div>
                </div>
                <Switch checked={seedQuests} onCheckedChange={setSeedQuests} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                <div>
                  <div className="text-xs font-medium text-neutral-200">
                    Iring-Dex (16 Species) &amp; Achievements (25 Tracks)
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Populates <code className="font-mono">dex_species</code> and{" "}
                    <code className="font-mono">achievement_tracks</code> with Explorer Titles.
                  </div>
                </div>
                <Switch
                  checked={seedDexAndAchievements}
                  onCheckedChange={setSeedDexAndAchievements}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-[#FF8C1A]/30 bg-[#FF8C1A]/5 p-3">
                <div>
                  <div className="text-xs font-medium text-neutral-100">
                    Cohesive Calico Starter Events (2 Events)
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Seeds <strong>Calico Dusk Gala</strong> (Obsidian/Marmalade) &amp;{" "}
                    <strong>Cebu Sanctuary Care Drive</strong> (Cinnamon/Honey).
                  </div>
                </div>
                <Switch
                  checked={seedCalicoStarterEvents}
                  onCheckedChange={setSeedCalicoStarterEvents}
                />
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-2">
            <Button
              type="button"
              onClick={handlePopulateBaseline}
              disabled={isPopulating || !initialOverview.isConfigured}
              className="w-full gap-2 bg-[#FF8C1A] text-white hover:bg-[#E06D00]"
            >
              <Database className="h-4 w-4" />
              {isPopulating
                ? "Populating Firestore Catalogs..."
                : "Populate Selected Baseline Data"}
            </Button>
          </div>
        </Card>

        {/* Right: Dry-Run Reset & Purge */}
        <Card className="flex flex-col justify-between">
          <form onSubmit={handleExecutePurge} className="flex h-full flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <RotateCcw className="h-4 w-4 text-red-400" />
                  Dry-Run Reset &amp; Mock Purge
                </CardTitle>
                <CardDescription>
                  Clean out development mock data or execute a full clean-slate reset before starting your live deployment test run.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {PURGE_OPTIONS.map((opt) => {
                    const active = selectedScope === opt.scope;
                    return (
                      <button
                        key={opt.scope}
                        type="button"
                        onClick={() => setSelectedScope(opt.scope)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          active
                            ? "border-[#FF8C1A] bg-[#FF8C1A]/10"
                            : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-neutral-100">
                            {opt.title}
                          </span>
                          {opt.recommended && (
                            <Badge className="bg-[#FF8C1A] text-[10px] text-white hover:bg-[#FF8C1A]">
                              Recommended for Dry Run
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                          {opt.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="confirmPhrase" className="text-xs text-neutral-300">
                    Type <span className="font-mono font-bold text-white">CONFIRM</span> to authorize operation
                  </Label>
                  <Input
                    id="confirmPhrase"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    placeholder="CONFIRM"
                    className="font-mono text-xs"
                  />
                </div>
              </CardContent>
            </div>

            <div className="p-6 pt-2">
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  isPurging ||
                  !initialOverview.isConfigured ||
                  confirmPhrase.trim() !== "CONFIRM"
                }
                className="w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {isPurging
                  ? "Executing Firestore Reset..."
                  : "Execute Selected Database Operation"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Live Collection Health Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Live Firestore Collection Matrix
          </CardTitle>
          <CardDescription>
            Real-time document counts and mock-record audit across all 10 mobile collections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-[11px] text-neutral-400">
                  <th className="pb-2.5 font-medium">Collection</th>
                  <th className="pb-2.5 font-medium">Role</th>
                  <th className="pb-2.5 font-medium">Documents</th>
                  <th className="pb-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {initialOverview.collections.map((col) => {
                  const missingBaseline =
                    col.expectedBaselineCount !== undefined &&
                    col.totalCount < col.expectedBaselineCount;
                  return (
                    <tr key={col.name}>
                      <td className="py-3 pr-4">
                        <div className="font-mono font-semibold text-neutral-100">
                          {col.name}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {col.label}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-neutral-400 max-w-md">
                        {col.description}
                      </td>
                      <td className="py-3 pr-4 font-mono text-neutral-200">
                        {col.totalCount}
                        {col.expectedBaselineCount !== undefined && (
                          <span className="text-neutral-500">
                            {" "}
                            / {col.expectedBaselineCount} baseline
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {col.mockCount > 0 && (
                            <Badge variant="destructive" className="text-[10px]">
                              {col.mockCount} Mock
                            </Badge>
                          )}
                          {missingBaseline ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 text-[10px] text-amber-300"
                            >
                              Needs Baseline Seed
                            </Badge>
                          ) : (
                            <Badge
                              variant="success"
                              className="text-[10px]"
                            >
                              Clean
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
