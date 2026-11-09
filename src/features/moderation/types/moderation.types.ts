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

export interface ModerationPageData {
  quests: QuestTemplateItem[];
  sightings: CommunitySightingItem[];
  stories: CommunityStoryItem[];
  season: ActiveSeasonData;
}
