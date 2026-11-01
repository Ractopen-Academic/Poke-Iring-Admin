"use server";

import { revalidatePath } from "next/cache";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { guardRequest } from "@/lib/security/request-guard";
import {
  validateEventId,
  validateEventInput,
} from "@/lib/security/validators";
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
    bannerColorValue: 0xff231a16,
    accentColorValue: 0xffff8c1a,
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
    bannerColorValue: 0xff5c2d16,
    accentColorValue: 0xffffb04f,
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
  const guard = await guardRequest("read");
  if (!guard.ok) {
    return {
      data: DEMO_EVENTS,
      isConfigured: isFirebaseAdminConfigured(),
      error: guard.error,
    };
  }

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
          : 0xff231a16,
        accentColorValue: Number.isFinite(Number(d.accentColorValue))
          ? Number(d.accentColorValue)
          : 0xffff8c1a,
        bannerImageUrl:
          typeof (d.bannerImageUrl ?? d.bannerUrl) === "string"
            ? (d.bannerImageUrl ?? d.bannerUrl)
            : "",
        logoImageUrl:
          typeof (d.logoImageUrl ?? d.logoUrl) === "string"
            ? (d.logoImageUrl ?? d.logoUrl)
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
      data: [],
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
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const validation = validateEventInput(input);
  if (!validation.ok) {
    return { success: false, error: validation.error };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error:
        "Firebase Admin is not configured. Provide credentials in .env.local to save changes.",
    };
  }

  try {
    const clean = validation.data;
    const now = new Date().toISOString();
    const docId = clean.id || `event_${Date.now()}`;
    const docRef = adminDb.collection("events").doc(docId);

    const bannerImageUrl = clean.bannerImageUrl || "";
    const logoImageUrl = clean.logoImageUrl || "";

    const dataToSave = {
      id: docId,
      title: clean.title,
      subtitle: clean.subtitle,
      description: clean.description,
      multiplier: clean.multiplier,
      eventType: clean.eventType,
      startDate: clean.startDate,
      endDate: clean.endDate,
      startsAt: clean.startDate,
      endsAt: clean.endDate,
      isActive: clean.isActive,
      isFeaturedInCarousel: clean.isFeaturedInCarousel,
      showPopupOnLaunch: clean.showPopupOnLaunch,
      priority: clean.priority,
      currencyName: clean.currencyName,
      currencyCode: clean.currencyCode,
      bannerColorValue: clean.bannerColorValue,
      accentColorValue: clean.accentColorValue,
      bannerImageUrl,
      bannerUrl: bannerImageUrl,
      logoImageUrl,
      logoUrl: logoImageUrl,
      partnerName: clean.partnerName || null,
      externalLink: clean.externalLink || null,
      updatedAt: now,
      ...(clean.id ? {} : { createdAt: now }),
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
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const idCheck = validateEventId(id);
  if (!idCheck.ok) {
    return { success: false, error: idCheck.error };
  }
  if (typeof isActive !== "boolean") {
    return { success: false, error: "Active state must be a boolean." };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error: "Firebase Admin is not configured.",
    };
  }

  try {
    await adminDb.collection("events").doc(idCheck.data).update({
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
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const idCheck = validateEventId(id);
  if (!idCheck.ok) {
    return { success: false, error: idCheck.error };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error: "Firebase Admin is not configured.",
    };
  }

  try {
    await adminDb.collection("events").doc(idCheck.data).delete();
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
