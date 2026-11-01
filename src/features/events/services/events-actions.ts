"use server";

import { revalidatePath } from "next/cache";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { EventType, GameEvent, GameEventInput } from "../types/event.types";

function toIsoString(val: unknown, fallback: string): string {
  if (typeof val === "string" && val.length > 0) {
    return val;
  }
  if (
    val &&
    typeof val === "object" &&
    "toDate" in val &&
    typeof (val as { toDate: () => Date }).toDate === "function"
  ) {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return fallback;
}

function clampMultiplier(value: unknown): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 1.0;
  return Math.min(5.0, Math.max(1.0, Math.round(parsed * 100) / 100));
}

const DEMO_EVENTS: GameEvent[] = [
  {
    id: "event_moonlit_strays_2026",
    title: "Moonlit Strays Festival",
    subtitle: "Exclusive Seasonal Gathering",
    description:
      "Stroll through dusk and dawn to map neighborhood cats and earn Moonlit Tokens for exclusive avatar borders.",
    multiplier: 2.0,
    eventType: "festival",
    startDate: "2026-10-30T00:00:00.000Z",
    endDate: "2026-11-12T23:59:59.000Z",
    isActive: true,
    isFeaturedInCarousel: true,
    showPopupOnLaunch: true,
    priority: 10,
    currencyName: "Moonlit Tokens",
    currencyCode: "MLT",
    bannerColorValue: 0xff4c1d95,
    accentColorValue: 0xfff59e0b,
    bannerImageUrl: "",
    createdAt: "2026-10-30T00:00:00.000Z",
    updatedAt: "2026-10-30T00:00:00.000Z",
  },
  {
    id: "event_cebu_shelter_partnership_2026",
    title: "Cebu Sanctuary Care Drive",
    subtitle: "Community Partnership Initiative",
    description:
      "Partnering with Island Rescue Organization to support neighborhood colony cats across Cebu.",
    multiplier: 1.5,
    eventType: "partnership",
    startDate: "2026-11-01T00:00:00.000Z",
    endDate: "2026-11-20T23:59:59.000Z",
    isActive: false,
    isFeaturedInCarousel: true,
    showPopupOnLaunch: false,
    priority: 8,
    currencyName: "Rescue Stars",
    currencyCode: "STR",
    bannerColorValue: 0xff0d9488,
    accentColorValue: 0xff14b8a6,
    bannerImageUrl: "",
    partnerName: "Island Rescue Org (IRO)",
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
    const snapshot = await adminDb.collection("events").get();
    if (snapshot.empty) {
      return { data: [], isConfigured: true };
    }

    const nowIso = new Date().toISOString();
    const events: GameEvent[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      const startIso = toIsoString(d.startDate ?? d.startsAt, nowIso);
      const endIso = toIsoString(d.endDate ?? d.endsAt, nowIso);
      const createdIso = toIsoString(d.createdAt, startIso);
      const updatedIso = toIsoString(d.updatedAt, createdIso);

      return {
        id: doc.id,
        title: typeof d.title === "string" ? d.title : "",
        subtitle:
          typeof d.subtitle === "string" && d.subtitle.length > 0
            ? d.subtitle
            : "Limited-Time Event",
        description: typeof d.description === "string" ? d.description : "",
        multiplier: clampMultiplier(d.multiplier ?? 1.0),
        eventType: (typeof d.eventType === "string"
          ? d.eventType
          : "festival") as EventType,
        startDate: startIso,
        endDate: endIso,
        isActive: d.isActive !== undefined ? Boolean(d.isActive) : true,
        isFeaturedInCarousel:
          d.isFeaturedInCarousel !== undefined
            ? Boolean(d.isFeaturedInCarousel)
            : true,
        showPopupOnLaunch: Boolean(d.showPopupOnLaunch),
        priority: Number.isFinite(Number(d.priority)) ? Number(d.priority) : 0,
        currencyName:
          typeof d.currencyName === "string" && d.currencyName.length > 0
            ? d.currencyName
            : "Moonlit Tokens",
        currencyCode:
          typeof d.currencyCode === "string" && d.currencyCode.length > 0
            ? d.currencyCode
            : "MLT",
        bannerColorValue: Number.isFinite(Number(d.bannerColorValue))
          ? Number(d.bannerColorValue)
          : 0xff4c1d95,
        accentColorValue: Number.isFinite(Number(d.accentColorValue))
          ? Number(d.accentColorValue)
          : 0xfff59e0b,
        bannerImageUrl:
          typeof (d.bannerImageUrl ?? d.bannerUrl) === "string"
            ? (d.bannerImageUrl ?? d.bannerUrl)
            : "",
        partnerName:
          typeof d.partnerName === "string" ? d.partnerName : undefined,
        externalLink:
          typeof d.externalLink === "string" ? d.externalLink : undefined,
        createdAt: createdIso,
        updatedAt: updatedIso,
      };
    });

    events.sort(
      (a, b) =>
        b.priority - a.priority || b.createdAt.localeCompare(a.createdAt)
    );

    return { data: events, isConfigured: true };
  } catch (err) {
    return {
      data: DEMO_EVENTS,
      isConfigured: true,
      error:
          err instanceof Error
            ? err.message
            : "Failed to load events from Firestore",
    };
  }
}

export async function upsertEventAction(
  input: GameEventInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error:
        "Firebase Admin is not configured. Provide credentials in .env.local to save changes.",
    };
  }

  try {
    const now = new Date().toISOString();
    const docId = input.id || `event_${Date.now()}`;
    const docRef = adminDb.collection("events").doc(docId);

    const startDate = toIsoString(input.startDate, now);
    const endDate = toIsoString(input.endDate, now);
    const bannerImageUrl = (input.bannerImageUrl || "").trim();

    const dataToSave = {
      id: docId,
      title: input.title.trim(),
      subtitle: input.subtitle.trim() || "Limited-Time Event",
      description: input.description.trim(),
      multiplier: clampMultiplier(input.multiplier),
      eventType: input.eventType,
      startDate,
      endDate,
      startsAt: startDate,
      endsAt: endDate,
      isActive: Boolean(input.isActive),
      isFeaturedInCarousel: Boolean(input.isFeaturedInCarousel),
      showPopupOnLaunch: Boolean(input.showPopupOnLaunch),
      priority: Number.isFinite(Number(input.priority))
        ? Number(input.priority)
        : 0,
      currencyName: input.currencyName.trim() || "Moonlit Tokens",
      currencyCode: input.currencyCode.trim().toUpperCase() || "MLT",
      bannerColorValue: Number.isFinite(Number(input.bannerColorValue))
        ? Number(input.bannerColorValue)
        : 0xff4c1d95,
      accentColorValue: Number.isFinite(Number(input.accentColorValue))
        ? Number(input.accentColorValue)
        : 0xfff59e0b,
      bannerImageUrl,
      bannerUrl: bannerImageUrl,
      partnerName: input.partnerName?.trim() || null,
      externalLink: input.externalLink?.trim() || null,
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
