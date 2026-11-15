export interface QuestTemplateItem {
  id: string;
  title: string;
  description: string;
  category: "daily" | "weekly";
  type: string;
  targetValue: number;
  rewardPawPoints: number;
  weight: number;
  isActive: boolean;
}

export interface CommunitySightingItem {
  id: string;
  photoUrl: string;
  breed: string;
  actor: string;
  pawPoints: number;
  barangay: string;
  createdAtIso: string;
  isFlagged?: boolean;
}

export interface CommunityStoryItem {
  id: string;
  mediaUrl: string;
  actor: string;
  createdAtIso: string;
  isFlagged?: boolean;
}

export interface ActiveSeasonData {
  id: string;
  number: number;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  status: "active" | "concluded";
}

export interface ExplorerUserItem {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  role: string;
  status: "active" | "suspended" | "banned";
  totalPawPoints: number;
  totalSnaps: number;
  distanceKm: number;
  createdAtIso: string;
  lastActiveIso: string;
  banReason?: string;
  bannedAtIso?: string;
  bannedBy?: string;
  suspendedUntilIso?: string;
}

export interface ExplorerAuditLogItem {
  id: string;
  category: "sighting" | "story" | "user" | "suspicious" | "admin";
  severity: "info" | "warning" | "danger";
  actorId: string;
  actorName: string;
  actorEmail?: string;
  targetId?: string;
  action: string;
  summary: string;
  details?: Record<string, unknown>;
  photoUrl?: string;
  timestampIso: string;
  flagReason?: string;
}

export interface ModerationPageData {
  quests: QuestTemplateItem[];
  sightings: CommunitySightingItem[];
  stories: CommunityStoryItem[];
  season: ActiveSeasonData;
  users: ExplorerUserItem[];
  auditLogs: ExplorerAuditLogItem[];
}
