"use server";

import { revalidatePath } from "next/cache";
import type { DocumentReference } from "firebase-admin/firestore";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { guardRequest } from "@/lib/security/request-guard";
import {
  validateDatabasePopulateRequest,
  validateDatabasePurgeRequest,
  type ValidatedPopulateRequest,
} from "@/lib/security/validators";
import {
  BASELINE_ACHIEVEMENT_TRACKS,
  BASELINE_DEX_SPECIES,
  BASELINE_QUEST_TEMPLATES,
  BASELINE_TERRITORIES,
  buildBaselineActiveSeason,
  buildBaselineAppConfig,
  buildCalicoStarterEvents,
  isMockFirestoreDocument,
} from "./baseline-catalogs";
import type {
  CollectionHealthRow,
  DashboardActivityItem,
  DashboardDailyBar,
  DashboardTelemetry,
  DatabaseOverview,
  DatabasePopulateResult,
  DatabasePurgeResult,
  SeededTerritoryRecord,
} from "../types/database.types";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const COLLECTION_SPECS: Array<{
  name: string;
  label: string;
  category: CollectionHealthRow["category"];
  expectedBaselineCount?: number;
  description: string;
}> = [
  {
    name: "app_config",
    label: "Remote App Config",
    category: "catalog",
    expectedBaselineCount: 1,
    description: "Global maintenance switch, broadcast banner, and minimum client semver.",
  },
  {
    name: "seasons",
    label: "Active Season Clock",
    category: "catalog",
    expectedBaselineCount: 1,
    description: "Active ranked season window and rollover status.",
  },
  {
    name: "territories",
    label: "PH Territory Catalog",
    category: "catalog",
    expectedBaselineCount: BASELINE_TERRITORIES.length,
    description: "Geofenced Philippine cities and selectable home barangays.",
  },
  {
    name: "quest_templates",
    label: "Paw Quest Templates",
    category: "catalog",
    expectedBaselineCount: BASELINE_QUEST_TEMPLATES.length,
    description: "Daily and weekly patrol quest definitions synced to mobile clients.",
  },
  {
    name: "dex_species",
    label: "Iring-Dex Species",
    category: "catalog",
    expectedBaselineCount: BASELINE_DEX_SPECIES.length,
    description: "Canonical feline coats and breed rarity entries (#001–#016).",
  },
  {
    name: "achievement_tracks",
    label: "Achievement Tracks",
    category: "catalog",
    expectedBaselineCount: BASELINE_ACHIEVEMENT_TRACKS.length,
    description: "4-tier Bronze-to-Platinum progression tracks and Explorer Titles.",
  },
  {
    name: "events",
    label: "Live Game Events",
    category: "live_ops",
    description: "Scheduled festivals, charity drives, multipliers, and launch modals.",
  },
  {
    name: "users",
    label: "Explorer Profiles",
    category: "player_data",
    description: "Authenticated player profiles and leaderboard standings.",
  },
  {
    name: "sightings",
    label: "Cat Sightings",
    category: "player_data",
    description: "Geotagged community cat captures pinned on the Live Map.",
  },
  {
    name: "stories",
    label: "24h Explorer Stories",
    category: "player_data",
    description: "Ephemeral 24-hour feline story posts on Explorer Home.",
  },
];

function parseFirestoreDateMs(raw: unknown): number | null {
  if (!raw) return null;
  if (
    typeof raw === "object" &&
    "toDate" in raw &&
    typeof (raw as { toDate?: unknown }).toDate === "function"
  ) {
    const d = (raw as { toDate: () => Date }).toDate();
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }
  if (typeof raw === "string") {
    const ms = Date.parse(raw);
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  return null;
}

function formatRelativeTime(timestampMs: number, nowMs = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function buildEmptyWeeklyBars(now = new Date()): DashboardDailyBar[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const bars: DashboardDailyBar[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(now.getTime() - offset * 86400000);
    const dateKey = d.toISOString().slice(0, 10);
    bars.push({
      day: dayNames[d.getDay()],
      dateKey,
      sightings: 0,
      height: "6%",
    });
  }
  return bars;
}

async function commitOperationsInChunks(
  operations: Array<
    | { kind: "delete"; ref: DocumentReference }
    | {
        kind: "set";
        ref: DocumentReference;
        data: Record<string, unknown>;
        merge?: boolean;
      }
  >
): Promise<void> {
  if (!adminDb || operations.length === 0) return;
  const CHUNK_SIZE = 400;
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const slice = operations.slice(i, i + CHUNK_SIZE);
    const batch = adminDb.batch();
    for (const op of slice) {
      if (op.kind === "delete") {
        batch.delete(op.ref);
      } else if (op.merge) {
        batch.set(op.ref, op.data, { merge: true });
      } else {
        batch.set(op.ref, op.data);
      }
    }
    await batch.commit();
  }
}

async function seedSelectedCatalogs(
  options: ValidatedPopulateRequest
): Promise<{ seededCount: number; collectionsUpdated: string[] }> {
  const ops: Array<{
    kind: "set";
    ref: DocumentReference;
    data: Record<string, unknown>;
    merge?: boolean;
  }> = [];
  const collectionsUpdated: string[] = [];
  const now = new Date();
  const nowIso = now.toISOString();

  if (options.seedConfigAndSeason) {
    ops.push({
      kind: "set",
      ref: adminDb.collection("app_config").doc("global"),
      data: buildBaselineAppConfig(nowIso),
      merge: true,
    });
    ops.push({
      kind: "set",
      ref: adminDb.collection("seasons").doc("active_season"),
      data: buildBaselineActiveSeason(now),
      merge: true,
    });
    collectionsUpdated.push("app_config", "seasons");
  }

  if (options.seedTerritories) {
    for (const territory of BASELINE_TERRITORIES) {
      ops.push({
        kind: "set",
        ref: adminDb.collection("territories").doc(territory.docId),
        data: {
          city: territory.city,
          province: territory.province,
          region: territory.region,
          barangays: territory.barangays,
        },
        merge: true,
      });
    }
    collectionsUpdated.push("territories");
  }

  if (options.seedQuests) {
    for (const tpl of BASELINE_QUEST_TEMPLATES) {
      ops.push({
        kind: "set",
        ref: adminDb.collection("quest_templates").doc(tpl.id),
        data: { ...tpl },
        merge: true,
      });
    }
    collectionsUpdated.push("quest_templates");
  }

  if (options.seedDexAndAchievements) {
    for (const sp of BASELINE_DEX_SPECIES) {
      ops.push({
        kind: "set",
        ref: adminDb.collection("dex_species").doc(sp.id),
        data: { ...sp },
        merge: true,
      });
    }
    for (const track of BASELINE_ACHIEVEMENT_TRACKS) {
      ops.push({
        kind: "set",
        ref: adminDb.collection("achievement_tracks").doc(track.id),
        data: { ...track },
        merge: true,
      });
    }
    collectionsUpdated.push("dex_species", "achievement_tracks");
  }

  if (options.seedCalicoStarterEvents) {
    const starterEvents = buildCalicoStarterEvents(now);
    for (const ev of starterEvents) {
      ops.push({
        kind: "set",
        ref: adminDb.collection("events").doc(ev.id),
        data: { ...ev },
        merge: true,
      });
    }
    collectionsUpdated.push("events");
  }

  await commitOperationsInChunks(ops);
  return {
    seededCount: ops.length,
    collectionsUpdated,
  };
}

function revalidateAllAdminRoutes(): void {
  revalidatePath("/");
  revalidatePath("/database");
  revalidatePath("/events");
  revalidatePath("/territories");
  revalidatePath("/config");
}

export async function getDatabaseOverviewAction(): Promise<
  ActionResponse<DatabaseOverview>
> {
  const guard = await guardRequest("read");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const configured = isFirebaseAdminConfigured() && Boolean(adminDb);
  if (!configured) {
    return {
      success: true,
      data: {
        isConfigured: false,
        isDeploymentReady: false,
        totalMockRecords: 0,
        missingBaselineCollections: COLLECTION_SPECS.filter(
          (s) => s.expectedBaselineCount !== undefined
        ).map((s) => s.name),
        collections: COLLECTION_SPECS.map((s) => ({
          ...s,
          totalCount: 0,
          mockCount: 0,
        })),
        checkedAt: new Date().toISOString(),
      },
    };
  }

  try {
    const snapshots = await Promise.all(
      COLLECTION_SPECS.map(async (spec) => {
        const snap = await adminDb.collection(spec.name).get();
        let mockCount = 0;
        for (const doc of snap.docs) {
          if (isMockFirestoreDocument(spec.name, doc.id, doc.data())) {
            mockCount += 1;
          }
        }
        return {
          ...spec,
          totalCount: snap.size,
          mockCount,
        };
      })
    );

    const totalMockRecords = snapshots.reduce((acc, r) => acc + r.mockCount, 0);
    const missingBaselineCollections = snapshots
      .filter(
        (r) =>
          r.expectedBaselineCount !== undefined && r.totalCount < r.expectedBaselineCount
      )
      .map((r) => r.name);

    return {
      success: true,
      data: {
        isConfigured: true,
        isDeploymentReady:
          totalMockRecords === 0 && missingBaselineCollections.length === 0,
        totalMockRecords,
        missingBaselineCollections,
        collections: snapshots,
        checkedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to inspect Firestore collections:", error);
    return {
      success: false,
      error: "Unable to query Firestore collection health.",
    };
  }
}

export async function getDashboardTelemetryAction(): Promise<
  ActionResponse<DashboardTelemetry>
> {
  const guard = await guardRequest("read");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const configured = isFirebaseAdminConfigured() && Boolean(adminDb);
  const weeklyBars = buildEmptyWeeklyBars();

  if (!configured) {
    return {
      success: true,
      data: {
        isConfigured: false,
        totalSightings: 0,
        sightingsLast7Days: 0,
        totalExplorers: 0,
        totalMockRecords: 0,
        totalTerritories: 0,
        totalBarangays: 0,
        weeklyActivity: weeklyBars,
        recentActivity: [],
      },
    };
  }

  try {
    const [sightingsSnap, usersSnap, territoriesSnap, storiesSnap] =
      await Promise.all([
        adminDb.collection("sightings").get(),
        adminDb.collection("users").get(),
        adminDb.collection("territories").get(),
        adminDb.collection("stories").get(),
      ]);

    const nowMs = Date.now();
    const sevenDaysAgoMs = nowMs - 7 * 86400000;
    const barByDateKey = new Map<string, DashboardDailyBar>();
    for (const bar of weeklyBars) {
      barByDateKey.set(bar.dateKey, bar);
    }

    let totalMockRecords = 0;
    let realSightingsCount = 0;
    let sightingsLast7Days = 0;
    const activityCandidates: Array<{
      id: string;
      actor: string;
      badge: string;
      action: string;
      tsMs: number;
    }> = [];

    for (const doc of sightingsSnap.docs) {
      const data = doc.data();
      if (isMockFirestoreDocument("sightings", doc.id, data)) {
        totalMockRecords += 1;
        continue;
      }
      realSightingsCount += 1;
      const tsMs =
        parseFirestoreDateMs(
          data.timestamp ?? data.capturedAt ?? data.createdAt
        ) ?? nowMs;
      if (tsMs >= sevenDaysAgoMs) {
        sightingsLast7Days += 1;
        const dateKey = new Date(tsMs).toISOString().slice(0, 10);
        const bucket = barByDateKey.get(dateKey);
        if (bucket) {
          bucket.sightings += 1;
        }
      }

      const actor =
        (typeof data.explorerName === "string" && data.explorerName.trim()) ||
        (typeof data.username === "string" && data.username.trim()) ||
        "Explorer";
      const breed =
        (typeof data.breed === "string" && data.breed.trim()) ||
        (typeof data.coatPattern === "string" && data.coatPattern.trim()) ||
        "Community Cat";
      const barangay =
        (typeof data.barangay === "string" && data.barangay.trim()) ||
        "Local Patrol";

      activityCandidates.push({
        id: `sighting-${doc.id}`,
        actor,
        badge: barangay,
        action: `Logged ${breed} sighting on Live Map`,
        tsMs,
      });
    }

    let realExplorersCount = 0;
    for (const doc of usersSnap.docs) {
      const data = doc.data();
      if (isMockFirestoreDocument("users", doc.id, data)) {
        totalMockRecords += 1;
        continue;
      }
      realExplorersCount += 1;
      const joinedMs = parseFirestoreDateMs(data.createdAt ?? data.updatedAt);
      if (joinedMs) {
        const actor =
          (typeof data.username === "string" && data.username.trim()) ||
          (typeof data.displayName === "string" && data.displayName.trim()) ||
          "Explorer";
        const city =
          (typeof data.city === "string" && data.city.trim()) || "Unassigned";
        activityCandidates.push({
          id: `user-${doc.id}`,
          actor,
          badge: city,
          action: "Registered explorer profile",
          tsMs: joinedMs,
        });
      }
    }

    for (const doc of storiesSnap.docs) {
      const data = doc.data();
      if (isMockFirestoreDocument("stories", doc.id, data)) {
        totalMockRecords += 1;
        continue;
      }
      const tsMs = parseFirestoreDateMs(data.createdAt ?? data.timestamp);
      if (tsMs) {
        const actor =
          (typeof data.username === "string" && data.username.trim()) ||
          (typeof data.explorerName === "string" && data.explorerName.trim()) ||
          "Explorer";
        activityCandidates.push({
          id: `story-${doc.id}`,
          actor,
          badge: "24h Story",
          action: "Published a neighborhood feline story",
          tsMs,
        });
      }
    }

    let totalBarangays = 0;
    for (const doc of territoriesSnap.docs) {
      const data = doc.data();
      if (Array.isArray(data.barangays)) {
        totalBarangays += data.barangays.length;
      }
    }

    const maxDailySightings = Math.max(
      1,
      ...weeklyBars.map((b) => b.sightings)
    );
    const normalizedWeekly = weeklyBars.map((b) => ({
      ...b,
      height:
        b.sightings === 0
          ? "6%"
          : `${Math.max(14, Math.round((b.sightings / maxDailySightings) * 100))}%`,
    }));

    activityCandidates.sort((a, b) => b.tsMs - a.tsMs);
    const recentActivity: DashboardActivityItem[] = activityCandidates
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        actor: item.actor,
        badge: item.badge,
        action: item.action,
        timestampIso: new Date(item.tsMs).toISOString(),
        relativeTime: formatRelativeTime(item.tsMs, nowMs),
      }));

    return {
      success: true,
      data: {
        isConfigured: true,
        totalSightings: realSightingsCount,
        sightingsLast7Days,
        totalExplorers: realExplorersCount,
        totalMockRecords,
        totalTerritories: territoriesSnap.size,
        totalBarangays,
        weeklyActivity: normalizedWeekly,
        recentActivity,
      },
    };
  } catch (error) {
    console.error("Failed to fetch dashboard telemetry:", error);
    return {
      success: false,
      error: "Failed to load live dashboard telemetry.",
    };
  }
}

export async function getSeededTerritoriesAction(): Promise<
  ActionResponse<SeededTerritoryRecord[]>
> {
  const guard = await guardRequest("read");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return { success: true, data: [] };
  }

  try {
    const snap = await adminDb.collection("territories").get();
    const list: SeededTerritoryRecord[] = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        city: typeof data.city === "string" ? data.city : doc.id,
        province: typeof data.province === "string" ? data.province : "",
        region: typeof data.region === "string" ? data.region : "Philippines",
        barangays: Array.isArray(data.barangays)
          ? data.barangays.map((b) => String(b))
          : [],
      };
    });

    list.sort(
      (a, b) =>
        a.region.localeCompare(b.region) || a.city.localeCompare(b.city)
    );
    return { success: true, data: list };
  } catch (error) {
    console.error("Failed to load territories:", error);
    return { success: false, error: "Failed to read territories collection." };
  }
}

export async function purgeDatabaseScopeAction(
  raw: unknown
): Promise<ActionResponse<DatabasePurgeResult>> {
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const parsed = validateDatabasePurgeRequest(raw);
  if (!parsed.ok) {
    return { success: false, error: parsed.error };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error:
        "Firebase Admin credentials are not configured in this environment.",
    };
  }

  const { scope } = parsed.data;
  const ops: Array<
    | { kind: "delete"; ref: DocumentReference }
    | {
        kind: "set";
        ref: DocumentReference;
        data: Record<string, unknown>;
        merge?: boolean;
      }
  > = [];

  let deletedCount = 0;
  let resetUsersCount = 0;
  let seededCount = 0;
  const nowIso = new Date().toISOString();

  try {
    if (scope === "mock_only" || scope === "full_dry_run_reset") {
      for (const colName of ["users", "sightings", "stories", "events"]) {
        const snap = await adminDb.collection(colName).get();
        for (const doc of snap.docs) {
          if (isMockFirestoreDocument(colName, doc.id, doc.data())) {
            ops.push({ kind: "delete", ref: doc.ref });
            deletedCount += 1;
          }
        }
      }
    }

    if (scope === "player_activity" || scope === "full_dry_run_reset") {
      for (const colName of ["sightings", "stories"]) {
        const snap = await adminDb.collection(colName).get();
        for (const doc of snap.docs) {
          const alreadyQueued = ops.some(
            (o) => o.kind === "delete" && o.ref.path === doc.ref.path
          );
          if (!alreadyQueued) {
            ops.push({ kind: "delete", ref: doc.ref });
            deletedCount += 1;
          }
        }
      }

      const usersSnap = await adminDb.collection("users").get();
      for (const doc of usersSnap.docs) {
        const isMock = isMockFirestoreDocument("users", doc.id, doc.data());
        if (isMock) {
          const alreadyQueued = ops.some(
            (o) => o.kind === "delete" && o.ref.path === doc.ref.path
          );
          if (!alreadyQueued) {
            ops.push({ kind: "delete", ref: doc.ref });
            deletedCount += 1;
          }
          continue;
        }

        ops.push({
          kind: "set",
          ref: doc.ref,
          merge: true,
          data: {
            pawPoints: 0,
            sightingsCount: 0,
            questsCompleted: 0,
            totalDistanceKm: 0,
            mythicPrestige: 0,
            seasonHistory: [],
            completedSeasonsCount: 0,
            ownedBorders: [],
            equippedBorderId: null,
            eventCurrencies: {},
            claimedEventQuests: [],
            updatedAt: nowIso,
          },
        });
        resetUsersCount += 1;
      }
    }

    if (scope === "all_events") {
      const eventsSnap = await adminDb.collection("events").get();
      for (const doc of eventsSnap.docs) {
        ops.push({ kind: "delete", ref: doc.ref });
        deletedCount += 1;
      }
    }

    await commitOperationsInChunks(ops);

    if (scope === "full_dry_run_reset") {
      const seedRes = await seedSelectedCatalogs({
        seedConfigAndSeason: true,
        seedTerritories: true,
        seedQuests: true,
        seedDexAndAchievements: true,
        seedCalicoStarterEvents: true,
      });
      seededCount = seedRes.seededCount;
    }

    revalidateAllAdminRoutes();

    const summaryByScope: Record<typeof scope, string> = {
      mock_only: `Removed ${deletedCount} mock/demo record(s) across users, sightings, stories, and events.`,
      player_activity: `Cleared ${deletedCount} activity/mock document(s) and reset ${resetUsersCount} explorer profile(s) to 0 points.`,
      all_events: `Cleared ${deletedCount} event document(s) from Firestore.`,
      full_dry_run_reset: `Dry-run reset complete: purged ${deletedCount} record(s), reset ${resetUsersCount} real explorer(s) to 0, and populated ${seededCount} canonical baseline document(s).`,
    };

    return {
      success: true,
      data: {
        scope,
        deletedCount,
        resetUsersCount,
        seededCount,
        summary: summaryByScope[scope],
      },
    };
  } catch (error) {
    console.error("Database purge action failed:", error);
    return {
      success: false,
      error: "Firestore operation failed during purge. Check server logs.",
    };
  }
}

export async function populateBaselineDatabaseAction(
  raw: unknown
): Promise<ActionResponse<DatabasePopulateResult>> {
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const parsed = validateDatabasePopulateRequest(raw);
  if (!parsed.ok) {
    return { success: false, error: parsed.error };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error:
        "Firebase Admin credentials are not configured in this environment.",
    };
  }

  try {
    const res = await seedSelectedCatalogs(parsed.data);
    revalidateAllAdminRoutes();
    return {
      success: true,
      data: {
        seededCount: res.seededCount,
        collectionsUpdated: res.collectionsUpdated,
        summary: `Populated ${res.seededCount} canonical document(s) across ${res.collectionsUpdated.join(", ")}.`,
      },
    };
  } catch (error) {
    console.error("Database populate baseline failed:", error);
    return {
      success: false,
      error: "Failed to write baseline catalogs to Firestore.",
    };
  }
}
