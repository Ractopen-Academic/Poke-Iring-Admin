import type { EventType, GameEventInput } from "@/features/events/types/event.types";
import type { GlobalAppConfig } from "@/features/config/types/config.types";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const ALLOWED_EVENT_TYPES = new Set<EventType>([
  "festival",
  "partnership",
  "charity",
  "spotlight",
  "double_points",
  "raid",
  "seasonal",
  "community",
  "general",
]);

const EVENT_ID_PATTERN = /^[a-zA-Z0-9_-]{3,80}$/;
const CURRENCY_CODE_PATTERN = /^[A-Z0-9]{2,6}$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function stripControlChars(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

export function validateSafeHttpsUrl(
  raw: unknown,
  fieldLabel: string
): ValidationResult<string> {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, data: "" };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: `${fieldLabel} must be a valid URL string.` };
  }
  const trimmed = stripControlChars(raw);
  if (trimmed.length === 0) {
    return { ok: true, data: "" };
  }
  if (trimmed.length > 2048) {
    return { ok: false, error: `${fieldLabel} exceeds maximum length (2048 chars).` };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return {
        ok: false,
        error: `${fieldLabel} must use the secure https:// protocol.`,
      };
    }
    if (parsed.username || parsed.password) {
      return {
        ok: false,
        error: `${fieldLabel} must not embed credentials.`,
      };
    }
    return { ok: true, data: parsed.toString() };
  } catch {
    return { ok: false, error: `${fieldLabel} is not a valid URL.` };
  }
}

export function validateEventId(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string") {
    return { ok: false, error: "Event ID must be a string." };
  }
  const trimmed = raw.trim();
  if (!EVENT_ID_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error: "Invalid event ID format (3–80 alphanumeric, dash, or underscore characters).",
    };
  }
  return { ok: true, data: trimmed };
}

export function validateEventInput(raw: unknown): ValidationResult<GameEventInput> {
  if (!isPlainObject(raw)) {
    return { ok: false, error: "Malformed event payload." };
  }

  let validatedId: string | undefined;
  if (raw.id !== undefined && raw.id !== null && raw.id !== "") {
    const idCheck = validateEventId(raw.id);
    if (!idCheck.ok) return idCheck;
    validatedId = idCheck.data;
  }

  const title = typeof raw.title === "string" ? stripControlChars(raw.title) : "";
  if (title.length < 3 || title.length > 100) {
    return {
      ok: false,
      error: "Event title must be between 3 and 100 characters.",
    };
  }

  const subtitle =
    typeof raw.subtitle === "string"
      ? stripControlChars(raw.subtitle)
      : "Limited-Time Event";
  if (subtitle.length < 2 || subtitle.length > 100) {
    return {
      ok: false,
      error: "Subtitle must be between 2 and 100 characters.",
    };
  }

  const description =
    typeof raw.description === "string" ? stripControlChars(raw.description) : "";
  if (description.length < 5 || description.length > 600) {
    return {
      ok: false,
      error: "Description must be between 5 and 600 characters.",
    };
  }

  if (
    typeof raw.eventType !== "string" ||
    !ALLOWED_EVENT_TYPES.has(raw.eventType as EventType)
  ) {
    return { ok: false, error: "Unsupported event type." };
  }

  const multiplierNum = Number(raw.multiplier);
  if (!Number.isFinite(multiplierNum) || multiplierNum < 1.0 || multiplierNum > 5.0) {
    return {
      ok: false,
      error: "Multiplier must be a valid number between 1.0 and 5.0.",
    };
  }

  const priorityNum = Number(raw.priority ?? 0);
  if (
    !Number.isFinite(priorityNum) ||
    !Number.isInteger(priorityNum) ||
    priorityNum < 0 ||
    priorityNum > 100
  ) {
    return {
      ok: false,
      error: "Priority must be a whole number between 0 and 100.",
    };
  }

  if (typeof raw.startDate !== "string" || typeof raw.endDate !== "string") {
    return { ok: false, error: "Start and end timestamps are required." };
  }
  const startMs = Date.parse(raw.startDate);
  const endMs = Date.parse(raw.endDate);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { ok: false, error: "Invalid start or end timestamp." };
  }
  if (endMs <= startMs) {
    return { ok: false, error: "End time must be after start time." };
  }
  const maxDurationMs = 366 * 24 * 60 * 60 * 1000;
  if (endMs - startMs > maxDurationMs) {
    return { ok: false, error: "Event duration cannot exceed 366 days." };
  }

  const currencyName =
    typeof raw.currencyName === "string" && stripControlChars(raw.currencyName).length > 0
      ? stripControlChars(raw.currencyName)
      : "Moonlit Tokens";
  if (currencyName.length < 2 || currencyName.length > 40) {
    return {
      ok: false,
      error: "Currency name must be between 2 and 40 characters.",
    };
  }

  const currencyCode =
    typeof raw.currencyCode === "string" && raw.currencyCode.trim().length > 0
      ? raw.currencyCode.trim().toUpperCase()
      : "MLT";
  if (!CURRENCY_CODE_PATTERN.test(currencyCode)) {
    return {
      ok: false,
      error: "Currency code must be 2–6 uppercase letters or digits.",
    };
  }

  const bannerColorValue = Number(raw.bannerColorValue ?? 0xff4c1d95);
  const accentColorValue = Number(raw.accentColorValue ?? 0xfff59e0b);
  if (
    !Number.isFinite(bannerColorValue) ||
    bannerColorValue < 0 ||
    bannerColorValue > 0xffffffff ||
    !Number.isFinite(accentColorValue) ||
    accentColorValue < 0 ||
    accentColorValue > 0xffffffff
  ) {
    return { ok: false, error: "Invalid banner or accent color value." };
  }

  const bannerUrlCheck = validateSafeHttpsUrl(raw.bannerImageUrl, "Banner image URL");
  if (!bannerUrlCheck.ok) return bannerUrlCheck;

  const logoUrlCheck = validateSafeHttpsUrl(raw.logoImageUrl, "Logo image URL");
  if (!logoUrlCheck.ok) return logoUrlCheck;

  const externalUrlCheck = validateSafeHttpsUrl(raw.externalLink, "External link URL");
  if (!externalUrlCheck.ok) return externalUrlCheck;

  let partnerName: string | undefined;
  if (typeof raw.partnerName === "string" && stripControlChars(raw.partnerName).length > 0) {
    partnerName = stripControlChars(raw.partnerName);
    if (partnerName.length > 80) {
      return { ok: false, error: "Partner name cannot exceed 80 characters." };
    }
  }

  return {
    ok: true,
    data: {
      ...(validatedId ? { id: validatedId } : {}),
      title,
      subtitle,
      description,
      eventType: raw.eventType as EventType,
      multiplier: Math.round(multiplierNum * 100) / 100,
      priority: priorityNum,
      startDate: new Date(startMs).toISOString(),
      endDate: new Date(endMs).toISOString(),
      isActive: Boolean(raw.isActive),
      isFeaturedInCarousel:
        raw.isFeaturedInCarousel !== undefined
          ? Boolean(raw.isFeaturedInCarousel)
          : true,
      showPopupOnLaunch: Boolean(raw.showPopupOnLaunch),
      currencyName,
      currencyCode,
      bannerColorValue: bannerColorValue >>> 0,
      accentColorValue: accentColorValue >>> 0,
      bannerImageUrl: bannerUrlCheck.data,
      logoImageUrl: logoUrlCheck.data,
      partnerName,
      externalLink: externalUrlCheck.data || undefined,
    },
  };
}

export function validateAppConfigUpdates(
  raw: unknown
): ValidationResult<Partial<GlobalAppConfig>> {
  if (!isPlainObject(raw)) {
    return { ok: false, error: "Malformed configuration payload." };
  }

  const sanitized: Partial<GlobalAppConfig> = {};

  if (raw.maintenanceMode !== undefined) {
    if (typeof raw.maintenanceMode !== "boolean") {
      return { ok: false, error: "maintenanceMode must be a boolean." };
    }
    sanitized.maintenanceMode = raw.maintenanceMode;
  }

  if (raw.maintenanceMessage !== undefined) {
    if (typeof raw.maintenanceMessage !== "string") {
      return { ok: false, error: "maintenanceMessage must be a string." };
    }
    const msg = stripControlChars(raw.maintenanceMessage);
    if (msg.length > 300) {
      return {
        ok: false,
        error: "Maintenance message cannot exceed 300 characters.",
      };
    }
    sanitized.maintenanceMessage = msg;
  }

  if (raw.minAppVersion !== undefined) {
    if (typeof raw.minAppVersion !== "string") {
      return { ok: false, error: "minAppVersion must be a string." };
    }
    const ver = raw.minAppVersion.trim();
    if (!SEMVER_PATTERN.test(ver)) {
      return {
        ok: false,
        error: "Minimum app version must follow semantic format (e.g. 0.31.0).",
      };
    }
    sanitized.minAppVersion = ver;
  }

  if (raw.broadcastBanner !== undefined) {
    if (typeof raw.broadcastBanner !== "string") {
      return { ok: false, error: "broadcastBanner must be a string." };
    }
    const banner = stripControlChars(raw.broadcastBanner);
    if (banner.length > 240) {
      return {
        ok: false,
        error: "Broadcast banner text cannot exceed 240 characters.",
      };
    }
    sanitized.broadcastBanner = banner;
  }

  if (raw.isBroadcastActive !== undefined) {
    if (typeof raw.isBroadcastActive !== "boolean") {
      return { ok: false, error: "isBroadcastActive must be a boolean." };
    }
    sanitized.isBroadcastActive = raw.isBroadcastActive;
  }

  if (raw.doublePointsGlobal !== undefined) {
    if (typeof raw.doublePointsGlobal !== "boolean") {
      return { ok: false, error: "doublePointsGlobal must be a boolean." };
    }
    sanitized.doublePointsGlobal = raw.doublePointsGlobal;
  }

  return { ok: true, data: sanitized };
}

export type EventMediaKind = "banner" | "logo";

export interface VerifiedImageFile {
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  extension: "png" | "jpg" | "webp";
}

function detectImageSignature(bytes: Uint8Array): VerifiedImageFile | null {
  if (bytes.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mimeType: "image/png", extension: "png" };
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mimeType: "image/webp", extension: "webp" };
  }

  return null;
}

export function validateEventImageBinary(
  bytes: Uint8Array,
  declaredMime: string,
  kind: EventMediaKind
): ValidationResult<VerifiedImageFile> {
  const maxBytes = kind === "banner" ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
  const maxLabel = kind === "banner" ? "5 MB" : "2 MB";

  if (bytes.byteLength < 32) {
    return { ok: false, error: "Uploaded image file is empty or corrupted." };
  }
  if (bytes.byteLength > maxBytes) {
    return {
      ok: false,
      error: `${kind === "banner" ? "Banner" : "Logo"} image exceeds the ${maxLabel} size limit.`,
    };
  }

  const detected = detectImageSignature(bytes);
  if (!detected) {
    return {
      ok: false,
      error: "Unsupported image format. Only PNG, JPG, and WebP files are accepted.",
    };
  }

  const normalizedDeclared = declaredMime.toLowerCase().trim();
  if (
    normalizedDeclared &&
    normalizedDeclared !== detected.mimeType &&
    !(normalizedDeclared === "image/jpg" && detected.mimeType === "image/jpeg")
  ) {
    return {
      ok: false,
      error: "File content signature does not match declared MIME type.",
    };
  }

  return { ok: true, data: detected };
}
