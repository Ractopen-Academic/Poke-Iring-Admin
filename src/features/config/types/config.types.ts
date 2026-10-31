export interface GlobalAppConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  minAppVersion: string;
  broadcastBanner: string;
  isBroadcastActive: boolean;
  doublePointsGlobal: boolean;
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_APP_CONFIG: GlobalAppConfig = {
  maintenanceMode: false,
  maintenanceMessage: "The Poke-Iring servers are currently undergoing routine maintenance. Please check back shortly.",
  minAppVersion: "1.0.0",
  broadcastBanner: "",
  isBroadcastActive: false,
  doublePointsGlobal: false,
  updatedAt: "2026-01-01T00:00:00.000Z",
  updatedBy: "system",
};
