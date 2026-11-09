"use server";

import { revalidatePath } from "next/cache";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { guardRequest } from "@/lib/security/request-guard";
import {
  BASELINE_QUEST_TEMPLATES,
  buildBaselineActiveSeason,
  isMockFirestoreDocument,
} from "@/features/database/services/baseline-catalogs";
import type {
  ActiveSeasonData,
  CommunitySightingItem,
  CommunityStoryItem,
  ModerationPageData,
  QuestTemplateItem,
} from "../types/moderation.types";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getModerationDataAction(): Promise<
  ActionResponse<ModerationPageData>
> {
  const guard = await guardRequest("read");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const defaultSeason = buildBaselineActiveSeason();

  if (!isFirebaseAdminConfigured() || !adminDb) {
    const fallbackQuests: QuestTemplateItem[] = BASELINE_QUEST_TEMPLATES.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      type: q.type,
      targetValue: q.targetValue,
      rewardPawPoints: q.rewardPawPoints,
      weight: 50,
      isActive: q.isActive,
    }));

    return {
      success: true,
      data: {
        quests: fallbackQuests,
        sightings: [],
        stories: [],
        season: defaultSeason as ActiveSeasonData,
      },
    };
  }

  try {
    const [questsSnap, sightingsSnap, storiesSnap, seasonsSnap] = await Promise.all([
      adminDb.collection("quest_templates").get(),
      adminDb.collection("sightings").limit(30).get(),
      adminDb.collection("stories").limit(30).get(),
      adminDb.collection("seasons").orderBy("number", "desc").limit(1).get(),
    ]);

    const quests: QuestTemplateItem[] = questsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: typeof d.title === "string" ? d.title : doc.id,
        description: typeof d.description === "string" ? d.description : "",
        category: d.category === "weekly" ? "weekly" : "daily",
        type: typeof d.type === "string" ? d.type : "steps",
        targetValue: typeof d.targetValue === "number" ? d.targetValue : 1000,
        rewardPawPoints: typeof d.rewardPawPoints === "number" ? d.rewardPawPoints : 50,
        weight: typeof d.weight === "number" ? d.weight : 50,
        isActive: d.isActive !== false,
      };
    });

    // If quest_templates is empty, populate fallback from baseline
    if (quests.length === 0) {
      for (const q of BASELINE_QUEST_TEMPLATES) {
        quests.push({
          id: q.id,
          title: q.title,
          description: q.description,
          category: q.category,
          type: q.type,
          targetValue: q.targetValue,
          rewardPawPoints: q.rewardPawPoints,
          weight: 50,
          isActive: q.isActive,
        });
      }
    }

    const sightings: CommunitySightingItem[] = [];
    for (const doc of sightingsSnap.docs) {
      const d = doc.data();
      if (isMockFirestoreDocument("sightings", doc.id, d)) continue;
      const photoUrl =
        (typeof d.photoUrl === "string" && d.photoUrl) ||
        (typeof d.stickerUrl === "string" && d.stickerUrl) ||
        "";
      const breed = (typeof d.breed === "string" && d.breed) || "Community Cat";
      const actor =
        (typeof d.explorerName === "string" && d.explorerName) ||
        (typeof d.username === "string" && d.username) ||
        "Explorer";
      const pawPoints = typeof d.pawPoints === "number" ? d.pawPoints : 50;
      const barangay = (typeof d.barangay === "string" && d.barangay) || "Local Patrol";
      const createdAtIso = d.createdAt
        ? new Date(d.createdAt.toDate?.() || d.createdAt).toISOString()
        : new Date().toISOString();

      sightings.push({
        id: doc.id,
        photoUrl,
        breed,
        actor,
        pawPoints,
        barangay,
        createdAtIso,
        isFlagged: Boolean(d.isFlagged),
      });
    }

    const stories: CommunityStoryItem[] = [];
    for (const doc of storiesSnap.docs) {
      const d = doc.data();
      if (isMockFirestoreDocument("stories", doc.id, d)) continue;
      const mediaUrl =
        (typeof d.storyMediaUrl === "string" && d.storyMediaUrl) ||
        (typeof d.mediaUrl === "string" && d.mediaUrl) ||
        "";
      const actor =
        (typeof d.username === "string" && d.username) ||
        (typeof d.explorerName === "string" && d.explorerName) ||
        "Explorer";
      const createdAtIso = d.createdAt
        ? new Date(d.createdAt.toDate?.() || d.createdAt).toISOString()
        : new Date().toISOString();

      stories.push({
        id: doc.id,
        mediaUrl,
        actor,
        createdAtIso,
        isFlagged: Boolean(d.isFlagged),
      });
    }

    let season: ActiveSeasonData = defaultSeason as ActiveSeasonData;
    if (!seasonsSnap.empty) {
      const sDoc = seasonsSnap.docs[0];
      const sData = sDoc.data();
      season = {
        id: sDoc.id,
        number: typeof sData.number === "number" ? sData.number : 1,
        title: typeof sData.title === "string" ? sData.title : `Season ${sData.number || 1}`,
        description: typeof sData.description === "string" ? sData.description : "",
        startsAt: typeof sData.startsAt === "string" ? sData.startsAt : defaultSeason.startsAt,
        endsAt: typeof sData.endsAt === "string" ? sData.endsAt : defaultSeason.endsAt,
        status: sData.status === "concluded" ? "concluded" : "active",
      };
    }

    return {
      success: true,
      data: {
        quests,
        sightings,
        stories,
        season,
      },
    };
  } catch (error) {
    console.error("Failed to load moderation data:", error);
    return {
      success: false,
      error: "Failed to load moderation and quest pool data.",
    };
  }
}

export async function toggleQuestTemplateAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return { success: true };
  }

  try {
    await adminDb.collection("quest_templates").doc(id).set(
      {
        isActive,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    revalidatePath("/moderation");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle quest state.",
    };
  }
}

export async function upsertQuestTemplateAction(
  template: QuestTemplateItem
): Promise<{ success: boolean; error?: string }> {
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return { success: true };
  }

  try {
    const docId = template.id || `tpl_${Date.now()}`;
    await adminDb.collection("quest_templates").doc(docId).set(
      {
        ...template,
        id: docId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    revalidatePath("/moderation");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save quest template.",
    };
  }
}

export async function deleteCommunityContentAction(
  type: "sighting" | "story",
  id: string
): Promise<{ success: boolean; error?: string }> {
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return { success: true };
  }

  try {
    const colName = type === "sighting" ? "sightings" : "stories";
    await adminDb.collection(colName).doc(id).delete();
    revalidatePath("/moderation");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete community post.",
    };
  }
}

export async function triggerSeasonRolloverAction(): Promise<{
  success: boolean;
  newSeasonNumber?: number;
  error?: string;
}> {
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return { success: true, newSeasonNumber: 2 };
  }

  try {
    const seasonsSnap = await adminDb
      .collection("seasons")
      .orderBy("number", "desc")
      .limit(1)
      .get();

    const currentNumber = seasonsSnap.empty ? 1 : (seasonsSnap.docs[0].data().number || 1);
    const newNumber = currentNumber + 1;
    const now = new Date();
    const startsAt = now.toISOString();
    const endsAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();

    const newSeasonRef = adminDb.collection("seasons").doc(`season_${newNumber}`);
    await newSeasonRef.set({
      id: `season_${newNumber}`,
      number: newNumber,
      title: `Season ${newNumber}: Whispering Calico`,
      description: `New competitive season underway. Explorer standings reset for Season ${newNumber}.`,
      startsAt,
      endsAt,
      status: "active",
      createdAt: startsAt,
    });

    if (!seasonsSnap.empty) {
      await seasonsSnap.docs[0].ref.set(
        { status: "concluded", concludedAt: startsAt },
        { merge: true }
      );
    }

    revalidatePath("/moderation");
    return { success: true, newSeasonNumber: newNumber };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to trigger season rollover.",
    };
  }
}
