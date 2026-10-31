"use server";

import { revalidatePath } from "next/cache";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { GameEvent, GameEventInput } from "../types/event.types";

const DEMO_EVENTS: GameEvent[] = [
  {
    id: "event_weekend_blitz",
    title: "Weekend Territory Blitz",
    description: "Earn 2x Paw Points and double territory claim bonuses across all city rings.",
    multiplier: 2.0,
    eventType: "double_points",
    startsAt: "2026-10-30T00:00:00.000Z",
    endsAt: "2026-11-05T23:59:59.000Z",
    isActive: true,
    bannerUrl: "",
    createdAt: "2026-10-30T00:00:00.000Z",
    updatedAt: "2026-10-30T00:00:00.000Z",
  },
  {
    id: "event_monsoon_cats",
    title: "Monsoon Whiskers Sighting Rate",
    description: "Increased encounter rate for water-dwelling feline dex species.",
    multiplier: 1.5,
    eventType: "community",
    startsAt: "2026-11-01T00:00:00.000Z",
    endsAt: "2026-11-10T23:59:59.000Z",
    isActive: false,
    bannerUrl: "",
    createdAt: "2026-10-30T00:00:00.000Z",
    updatedAt: "2026-10-30T00:00:00.000Z",
  },
];

export async function getEventsAction(): Promise<{
  data: GameEvent[];
  isConfigured: boolean;
  error?: string;
}> {
  if (!isFirebaseAdminConfigured() || !adminDb) {
    return { data: DEMO_EVENTS, isConfigured: false };
  }

  try {
    const snapshot = await adminDb.collection("events").orderBy("createdAt", "desc").get();
    if (snapshot.empty) {
      return { data: [], isConfigured: true };
    }

    const events: GameEvent[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title || "",
        description: d.description || "",
        multiplier: Number(d.multiplier) || 1.0,
        eventType: d.eventType || "general",
        startsAt: d.startsAt || new Date().toISOString(),
        endsAt: d.endsAt || new Date().toISOString(),
        isActive: Boolean(d.isActive),
        bannerUrl: d.bannerUrl || "",
        createdAt: d.createdAt || new Date().toISOString(),
        updatedAt: d.updatedAt || new Date().toISOString(),
      };
    });

    return { data: events, isConfigured: true };
  } catch (err) {
    return {
      data: DEMO_EVENTS,
      isConfigured: true,
      error: err instanceof Error ? err.message : "Failed to load events from Firestore",
    };
  }
}

export async function upsertEventAction(
  input: GameEventInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error: "Firebase Admin is not configured. Provide credentials in .env.local to save changes.",
    };
  }

  try {
    const now = new Date().toISOString();
    const docId = input.id || `event_${Date.now()}`;
    const docRef = adminDb.collection("events").doc(docId);

    const dataToSave = {
      title: input.title,
      description: input.description,
      multiplier: Number(input.multiplier) || 1.0,
      eventType: input.eventType,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: Boolean(input.isActive),
      bannerUrl: input.bannerUrl || "",
      updatedAt: now,
      ...(input.id ? {} : { createdAt: now }),
    };

    await docRef.set(dataToSave, { merge: true });

    revalidatePath("/events");
    revalidatePath("/");
    return { success: true, id: docId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upsert event.",
    };
  }
}

export async function toggleEventStatusAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error: "Firebase Admin is not configured.",
    };
  }

  try {
    await adminDb.collection("events").doc(id).update({
      isActive,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/events");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update event status.",
    };
  }
}

export async function deleteEventAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error: "Firebase Admin is not configured.",
    };
  }

  try {
    await adminDb.collection("events").doc(id).delete();
    revalidatePath("/events");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete event.",
    };
  }
}
