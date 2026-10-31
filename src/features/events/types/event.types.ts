export type EventType = "double_points" | "raid" | "seasonal" | "community" | "general";

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  multiplier: number;
  eventType: EventType;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  bannerUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type GameEventInput = Omit<GameEvent, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};
