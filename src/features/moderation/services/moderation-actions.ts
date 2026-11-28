"use server";

import { revalidatePath } from "next/cache";
import { adminDb, getAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { guardRequest } from "@/lib/security/request-guard";
import { isAdminEmail, verifyAdminSession } from "@/lib/security/auth-guard";
import {
  BASELINE_QUEST_TEMPLATES,
  buildBaselineActiveSeason,
  isMockFirestoreDocument,
} from "@/features/database/services/baseline-catalogs";
import type {
  ActiveSeasonData,
  CommunitySightingItem,
  CommunityStoryItem,
  ExplorerAuditLogItem,
  ExplorerUserItem,
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
        users: [],
        auditLogs: [],
      },
    };
  }

  try {
    const [questsSnap, sightingsSnap, storiesSnap, seasonsSnap, usersSnap, modLogsSnap] =
      await Promise.all([
        adminDb.collection("quest_templates").get(),
        adminDb.collection("sightings").limit(50).get(),
        adminDb.collection("stories").limit(50).get(),
        adminDb.collection("seasons").orderBy("number", "desc").limit(1).get(),
        adminDb.collection("users").limit(100).get(),
        adminDb.collection("moderation_logs").limit(50).get(),
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
        (typeof d.authorName === "string" && d.authorName) ||
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

    const users: ExplorerUserItem[] = usersSnap.docs.map((doc) => {
      const d = doc.data();
      const email = typeof d.email === "string" ? d.email : "";
      const displayName =
        typeof d.displayName === "string"
          ? d.displayName
          : email
            ? email.split("@")[0]
            : doc.id;
      const photoUrl = typeof d.photoUrl === "string" ? d.photoUrl : undefined;
      const role = typeof d.role === "string" ? d.role : "player";

      let status: "active" | "suspended" | "banned" = "active";
      if (d.status === "banned") status = "banned";
      else if (d.status === "suspended") status = "suspended";

      let suspendedUntilIso: string | undefined;
      if (d.suspendedUntil) {
        const rawUntil = d.suspendedUntil;
        const untilMs =
          typeof rawUntil === "object" &&
          rawUntil !== null &&
          "toDate" in rawUntil &&
          typeof (rawUntil as { toDate?: unknown }).toDate === "function"
            ? (rawUntil as { toDate: () => Date }).toDate().getTime()
            : Date.parse(String(rawUntil));
        if (!Number.isNaN(untilMs)) {
          suspendedUntilIso = new Date(untilMs).toISOString();
          if (status === "suspended" && Date.now() > untilMs) {
            status = "active";
          }
        }
      }

      const createdAtIso = d.createdAt
        ? new Date(d.createdAt.toDate?.() || d.createdAt).toISOString()
        : new Date().toISOString();
      const lastActiveIso = d.lastActive
        ? new Date(d.lastActive.toDate?.() || d.lastActive).toISOString()
        : createdAtIso;

      return {
        id: doc.id,
        email,
        displayName,
        photoUrl,
        role,
        status,
        totalPawPoints:
          typeof d.totalPawPoints === "number" ? d.totalPawPoints : 0,
        totalSnaps: typeof d.totalSnaps === "number" ? d.totalSnaps : 0,
        distanceKm: typeof d.distanceKm === "number" ? d.distanceKm : 0,
        createdAtIso,
        lastActiveIso,
        banReason: typeof d.banReason === "string" ? d.banReason : undefined,
        bannedAtIso: typeof d.bannedAt === "string" ? d.bannedAt : undefined,
        bannedBy: typeof d.bannedBy === "string" ? d.bannedBy : undefined,
        suspendedUntilIso,
      };
    });

    const auditLogs: ExplorerAuditLogItem[] = [];

    // 1. Audit items from Sightings
    for (const doc of sightingsSnap.docs) {
      const d = doc.data();
      if (isMockFirestoreDocument("sightings", doc.id, d)) continue;
      const actorId = typeof d.userId === "string" ? d.userId : "";
      const actorName =
        (typeof d.authorName === "string" && d.authorName) ||
        (typeof d.explorerName === "string" && d.explorerName) ||
        "Explorer";
      const breed = (typeof d.breed === "string" && d.breed) || "Cat";
      const barangay =
        (typeof d.barangay === "string" && d.barangay) || "Territory";
      const pawPoints = typeof d.pawPoints === "number" ? d.pawPoints : 0;
      const photoUrl =
        (typeof d.photoUrl === "string" && d.photoUrl) ||
        (typeof d.stickerUrl === "string" && d.stickerUrl) ||
        undefined;
      const lat =
        typeof d.latitude === "number" ? d.latitude : d.location?._latitude;
      const lng =
        typeof d.longitude === "number" ? d.longitude : d.location?._longitude;
      const createdAtIso = d.createdAt
        ? new Date(d.createdAt.toDate?.() || d.createdAt).toISOString()
        : new Date().toISOString();

      let severity: "info" | "warning" | "danger" = "info";
      let action = "Sighting Registered";
      let flagReason: string | undefined;

      const hasCoords = typeof lat === "number" && typeof lng === "number";
      const isOutOfBounds =
        hasCoords && (lat < 4.5 || lat > 21.5 || lng < 116.5 || lng > 127.0);

      if (isOutOfBounds) {
        severity = "danger";
        action = "Suspicious Location (Spoof Alert)";
        flagReason = `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) fall outside Philippine territory.`;
      } else if (Boolean(d.isFlagged)) {
        severity = "warning";
        action = "Community Flagged Sighting";
        flagReason = "Flagged by community review for moderation check.";
      } else if (pawPoints > 120) {
        severity = "warning";
        action = "High Reward Sighting";
        flagReason = `Awarded ${pawPoints} Paw Points (unusually high).`;
      }

      auditLogs.push({
        id: `audit_sighting_${doc.id}`,
        category: isOutOfBounds ? "suspicious" : "sighting",
        severity,
        actorId,
        actorName,
        targetId: doc.id,
        action,
        summary: `Logged ${breed} in ${barangay} (${hasCoords ? `${lat.toFixed(3)}, ${lng.toFixed(3)}` : "GPS mapped"}, +${pawPoints} pts)`,
        details: { lat, lng, breed, barangay, pawPoints },
        photoUrl,
        timestampIso: createdAtIso,
        flagReason,
      });
    }

    // 2. Audit items from Stories
    for (const doc of storiesSnap.docs) {
      const d = doc.data();
      if (isMockFirestoreDocument("stories", doc.id, d)) continue;
      const actorId = typeof d.userId === "string" ? d.userId : "";
      const actorName =
        (typeof d.authorName === "string" && d.authorName) ||
        (typeof d.username === "string" && d.username) ||
        "Explorer";
      const mediaUrl =
        (typeof d.mediaUrl === "string" && d.mediaUrl) ||
        (typeof d.storyMediaUrl === "string" && d.storyMediaUrl) ||
        undefined;
      const createdAtIso = d.createdAt
        ? new Date(d.createdAt.toDate?.() || d.createdAt).toISOString()
        : new Date().toISOString();

      const isFlagged = Boolean(d.isFlagged);
      auditLogs.push({
        id: `audit_story_${doc.id}`,
        category: isFlagged ? "suspicious" : "story",
        severity: isFlagged ? "warning" : "info",
        actorId,
        actorName,
        targetId: doc.id,
        action: isFlagged ? "Flagged Story Submission" : "24h Story Published",
        summary: isFlagged
          ? "Story reported by explorers for review."
          : `Published 24-hour visual story in community feed.`,
        photoUrl: mediaUrl,
        timestampIso: createdAtIso,
        flagReason: isFlagged
          ? "Reported for community guidelines review."
          : undefined,
      });
    }

    // 3. Audit items from Admin Moderation Logs
    for (const doc of modLogsSnap.docs) {
      const d = doc.data();
      const actionType = typeof d.action === "string" ? d.action : "moderation";
      const adminEmail =
        typeof d.adminEmail === "string" ? d.adminEmail : "admin@iring.ph";
      const adminUid = typeof d.adminUid === "string" ? d.adminUid : "";
      const targetUid = typeof d.targetUid === "string" ? d.targetUid : "";
      const targetEmail =
        typeof d.targetEmail === "string" ? d.targetEmail : targetUid;
      const reason = typeof d.reason === "string" ? d.reason : "";
      const timestampIso =
        typeof d.timestamp === "string" ? d.timestamp : new Date().toISOString();

      let severity: "info" | "warning" | "danger" = "info";
      let actionLabel = "Admin Action";
      let summary = "";

      if (actionType === "ban") {
        severity = "danger";
        actionLabel = "Explorer Account Banned";
        summary = `Admin ${adminEmail} permanently banned ${targetEmail || targetUid}: "${reason}"`;
      } else if (actionType === "suspend") {
        severity = "warning";
        actionLabel = "Explorer Account Suspended";
        summary = `Admin ${adminEmail} suspended ${targetEmail || targetUid} for ${d.durationHours || 24}h: "${reason}"`;
      } else if (actionType === "unban") {
        severity = "info";
        actionLabel = "Explorer Reinstated";
        summary = `Admin ${adminEmail} lifted penalty on ${targetEmail || targetUid}`;
      }

      auditLogs.push({
        id: `audit_mod_${doc.id}`,
        category: "admin",
        severity,
        actorId: adminUid,
        actorName: adminEmail,
        actorEmail: adminEmail,
        targetId: targetUid,
        action: actionLabel,
        summary,
        timestampIso,
        flagReason: reason || undefined,
      });
    }

    // 4. Audit items from Banned / Suspended Accounts
    for (const user of users) {
      if (user.status === "banned") {
        auditLogs.push({
          id: `audit_user_banned_${user.id}`,
          category: "user",
          severity: "danger",
          actorId: user.id,
          actorName: user.displayName,
          actorEmail: user.email,
          targetId: user.id,
          action: "Banned Account on Record",
          summary: `Explorer ${user.displayName} is banned: "${user.banReason || "Terms violation"}"`,
          timestampIso: user.bannedAtIso || user.createdAtIso,
          flagReason: user.banReason,
        });
      } else if (user.status === "suspended") {
        auditLogs.push({
          id: `audit_user_suspended_${user.id}`,
          category: "user",
          severity: "warning",
          actorId: user.id,
          actorName: user.displayName,
          actorEmail: user.email,
          targetId: user.id,
          action: "Suspended Account on Record",
          summary: `Explorer ${user.displayName} is suspended: "${user.banReason || "Safety pause"}"`,
          timestampIso: user.bannedAtIso || user.createdAtIso,
          flagReason: user.banReason,
        });
      }
    }

    // Sort newest first
    auditLogs.sort((a, b) => b.timestampIso.localeCompare(a.timestampIso));

    return {
      success: true,
      data: {
        quests,
        sightings,
        stories,
        season,
        users,
        auditLogs,
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

export async function suspendExplorerAction(
  targetUid: string,
  reason: string,
  durationHours: number
): Promise<{ success: boolean; error?: string }> {
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const session = await verifyAdminSession();
  if (!session.ok || !session.user) {
    return { success: false, error: "Unauthorized admin session." };
  }

  if (session.user.uid === targetUid) {
    return {
      success: false,
      error: "Self-protection guard: You cannot suspend your own administrator account.",
    };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error: "Firebase Admin is offline or unconfigured.",
    };
  }

  try {
    const targetDocSnap = await adminDb.collection("users").doc(targetUid).get();
    if (!targetDocSnap.exists) {
      return { success: false, error: "Explorer account not found in database." };
    }

    const targetData = targetDocSnap.data() || {};
    const targetEmail = typeof targetData.email === "string" ? targetData.email : "";

    if (isAdminEmail(targetEmail) || targetData.role === "admin") {
      return {
        success: false,
        error: "Protected account: Administrators (@iring.ph) cannot be suspended.",
      };
    }

    const duration = Math.max(1, Math.min(8760, durationHours || 24));
    const now = new Date();
    const suspendedUntil = new Date(
      now.getTime() + duration * 3600 * 1000
    ).toISOString();
    const cleanReason =
      reason.trim() || "Temporary suspension for explorer safety rules violation.";

    const adminAuth = await getAdminAuth();
    if (adminAuth) {
      try {
        await adminAuth.updateUser(targetUid, { disabled: true });
        await adminAuth.revokeRefreshTokens(targetUid);
      } catch (authErr) {
        console.warn("Auth disable skipped for UID:", targetUid, authErr);
      }
    }

    await adminDb.collection("users").doc(targetUid).set(
      {
        status: "suspended",
        banReason: cleanReason,
        suspendedUntil,
        bannedAt: now.toISOString(),
        bannedBy: session.user.email,
        updatedAt: now.toISOString(),
      },
      { merge: true }
    );

    await adminDb.collection("moderation_logs").add({
      action: "suspend",
      targetUid,
      targetEmail,
      reason: cleanReason,
      durationHours: duration,
      suspendedUntil,
      adminEmail: session.user.email,
      adminUid: session.user.uid,
      timestamp: now.toISOString(),
    });

    revalidatePath("/moderation");
    return { success: true };
  } catch (err) {
    console.error("Failed to suspend explorer:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to suspend explorer.",
    };
  }
}

export async function banExplorerAction(
  targetUid: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const session = await verifyAdminSession();
  if (!session.ok || !session.user) {
    return { success: false, error: "Unauthorized admin session." };
  }

  if (session.user.uid === targetUid) {
    return {
      success: false,
      error: "Self-protection guard: You cannot ban your own administrator account.",
    };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error: "Firebase Admin is offline or unconfigured.",
    };
  }

  try {
    const targetDocSnap = await adminDb.collection("users").doc(targetUid).get();
    if (!targetDocSnap.exists) {
      return { success: false, error: "Explorer account not found in database." };
    }

    const targetData = targetDocSnap.data() || {};
    const targetEmail = typeof targetData.email === "string" ? targetData.email : "";

    if (isAdminEmail(targetEmail) || targetData.role === "admin") {
      return {
        success: false,
        error: "Protected account: Administrators (@iring.ph) cannot be banned.",
      };
    }

    const now = new Date();
    const cleanReason =
      reason.trim() || "Permanent account expulsion for Terms of Service violations.";

    const adminAuth = await getAdminAuth();
    if (adminAuth) {
      try {
        await adminAuth.updateUser(targetUid, { disabled: true });
        await adminAuth.revokeRefreshTokens(targetUid);
      } catch (authErr) {
        console.warn("Auth disable skipped for UID:", targetUid, authErr);
      }
    }

    await adminDb.collection("users").doc(targetUid).set(
      {
        status: "banned",
        banReason: cleanReason,
        bannedAt: now.toISOString(),
        bannedBy: session.user.email,
        updatedAt: now.toISOString(),
      },
      { merge: true }
    );

    await adminDb.collection("moderation_logs").add({
      action: "ban",
      targetUid,
      targetEmail,
      reason: cleanReason,
      adminEmail: session.user.email,
      adminUid: session.user.uid,
      timestamp: now.toISOString(),
    });

    revalidatePath("/moderation");
    return { success: true };
  } catch (err) {
    console.error("Failed to ban explorer:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to ban explorer.",
    };
  }
}

export async function unbanExplorerAction(
  targetUid: string
): Promise<{ success: boolean; error?: string }> {
  const guard = await guardRequest("mutation");
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const session = await verifyAdminSession();
  if (!session.ok || !session.user) {
    return { success: false, error: "Unauthorized admin session." };
  }

  if (!isFirebaseAdminConfigured() || !adminDb) {
    return {
      success: false,
      error: "Firebase Admin is offline or unconfigured.",
    };
  }

  try {
    const targetDocSnap = await adminDb.collection("users").doc(targetUid).get();
    if (!targetDocSnap.exists) {
      return { success: false, error: "Explorer account not found." };
    }

    const targetData = targetDocSnap.data() || {};
    const targetEmail = typeof targetData.email === "string" ? targetData.email : "";
    const now = new Date();

    const adminAuth = await getAdminAuth();
    if (adminAuth) {
      try {
        await adminAuth.updateUser(targetUid, { disabled: false });
      } catch (authErr) {
        console.warn("Auth re-enable skipped for UID:", targetUid, authErr);
      }
    }

    const { FieldValue } = await import("firebase-admin/firestore");
    await adminDb.collection("users").doc(targetUid).update({
      status: "active",
      banReason: FieldValue.delete(),
      suspendedUntil: FieldValue.delete(),
      bannedAt: FieldValue.delete(),
      bannedBy: FieldValue.delete(),
      updatedAt: now.toISOString(),
    });

    await adminDb.collection("moderation_logs").add({
      action: "unban",
      targetUid,
      targetEmail,
      adminEmail: session.user.email,
      adminUid: session.user.uid,
      timestamp: now.toISOString(),
    });

    revalidatePath("/moderation");
    return { success: true };
  } catch (err) {
    console.error("Failed to lift suspension/ban:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reinstate explorer.",
    };
  }
}
