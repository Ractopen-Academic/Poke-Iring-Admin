export type EventType =
  | "festival"
  | "partnership"
  | "charity"
  | "spotlight"
  | "double_points"
  | "raid"
  | "seasonal"
  | "community"
  | "general";

export interface GameEvent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  multiplier: number;
  eventType: EventType;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFeaturedInCarousel: boolean;
  showPopupOnLaunch: boolean;
  priority: number;
  currencyName: string;
  currencyCode: string;
  bannerColorValue: number;
  accentColorValue: number;
  bannerImageUrl?: string;
  logoImageUrl?: string;
  partnerName?: string;
  externalLink?: string;
  createdAt: string;
  updatedAt: string;
}

export type GameEventInput = Omit<GameEvent, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};
