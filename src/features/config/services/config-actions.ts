"use server";

import { revalidatePath } from "next/cache";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { guardRequest } from "@/lib/security/request-guard";
import { validateAppConfigUpdates } from "@/lib/security/validators";
import { DEFAULT_APP_CONFIG, type GlobalAppConfig } from "../types/config.types";

const CONFIG_DOC_PATH = { collection: "app_config", doc: "global" };

export async function getAppConfigAction(): Promise<{
  data: GlobalAppConfig;
  isConfigured: boolean;
  error?: string;
}> {
  const guard = await guardRequest("read");
  if (!guard.ok) {
    return {
      data: DEFAULT_APP_CONFIG,
      isConfigured: isFirebaseAdminConfigured(),
      error: guard.error,
    };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return { data: DEFAULT_APP_CONFIG, isConfigured: false };
  }

  try {
    const docRef = adminDb.collection(CONFIG_DOC_PATH.collection).doc(CONFIG_DOC_PATH.doc);
    const snap = await docRef.get();

    if (!snap.exists) {
      // Seed default config document on first read
      await docRef.set(DEFAULT_APP_CONFIG);
      return { data: DEFAULT_APP_CONFIG, isConfigured: true };
    }

    const d = snap.data() || {};
    const config: GlobalAppConfig = {
      maintenanceMode: Boolean(d.maintenanceMode),
      maintenanceMessage: d.maintenanceMessage || DEFAULT_APP_CONFIG.maintenanceMessage,
      minAppVersion: d.minAppVersion || DEFAULT_APP_CONFIG.minAppVersion,
      broadcastBanner: d.broadcastBanner || "",
      isBroadcastActive: Boolean(d.isBroadcastActive),
      doublePointsGlobal: Boolean(d.doublePointsGlobal),
      updatedAt: d.updatedAt || new Date().toISOString(),
      updatedBy: d.updatedBy || "admin",
    };

    return { data: config, isConfigured: true };
  } catch (err) {
    return {
      data: DEFAULT_APP_CONFIG,
      isConfigured: true,
      error: err instanceof Error ? err.message : "Failed to load global config",
    };
  }
}

export async function updateAppConfigAction(
  updates: Partial<GlobalAppConfig>
): Promise<{ success: boolean; error?: string }> {
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const validation = validateAppConfigUpdates(updates);
  if (!validation.ok) {
    return { success: false, error: validation.error };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error: "Firebase Admin is not configured. Add credentials in .env.local to persist changes.",
    };
  }

  try {
    const docRef = adminDb.collection(CONFIG_DOC_PATH.collection).doc(CONFIG_DOC_PATH.doc);
    const payload = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
      updatedBy: "admin_portal",
    };

    await docRef.set(payload, { merge: true });

    revalidatePath("/config");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update configuration",
    };
  }
}
