import type { DatabasePurgeScope } from "@/lib/security/validators";

export type CollectionCategory = "catalog" | "live_ops" | "player_data";

export interface CollectionHealthRow {
  name: string;
  label: string;
  category: CollectionCategory;
  expectedBaselineCount?: number;
  totalCount: number;
  mockCount: number;
  description: string;
}

export interface DatabaseOverview {
  isConfigured: boolean;
  isDeploymentReady: boolean;
  totalMockRecords: number;
  missingBaselineCollections: string[];
  collections: CollectionHealthRow[];
  checkedAt: string;
}

export interface DashboardDailyBar {
  day: string;
  dateKey: string;
  sightings: number;
  height: string;
}

export interface DashboardActivityItem {
  id: string;
  actor: string;
  badge: string;
  action: string;
  timestampIso: string;
  relativeTime: string;
}

export interface DashboardTelemetry {
  isConfigured: boolean;
  totalSightings: number;
  sightingsLast7Days: number;
  totalExplorers: number;
  totalMockRecords: number;
  totalTerritories: number;
  totalBarangays: number;
  weeklyActivity: DashboardDailyBar[];
  recentActivity: DashboardActivityItem[];
}

export interface SeededTerritoryRecord {
  id: string;
  city: string;
  province: string;
  region: string;
  barangays: string[];
}

export interface ExplorerTerritoryBinding {
  userId: string;
  username: string;
  displayName: string;
  city: string;
  barangay: string;
  isLocked: boolean;
  lockedUntilIso: string | null;
  lastChangedIso: string | null;
}

export interface TerritoryStanding {
  city: string;
  region: string;
  sightingsCount: number;
  explorersCount: number;
  barangaysCount: number;
  isContested: boolean;
}

export interface TerritoryManagementData {
  territories: SeededTerritoryRecord[];
  standings: TerritoryStanding[];
  bindings: ExplorerTerritoryBinding[];
  contestedCities: string[];
}

export interface DatabasePurgeResult {
  scope: DatabasePurgeScope;
  deletedCount: number;
  resetUsersCount: number;
  seededCount: number;
  summary: string;
}

export interface DatabasePopulateResult {
  seededCount: number;
  collectionsUpdated: string[];
  summary: string;
}
