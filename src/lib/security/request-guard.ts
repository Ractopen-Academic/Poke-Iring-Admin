import "server-only";
import { headers } from "next/headers";

export type RequestBucket = "read" | "mutation" | "upload";

export interface GuardResult {
  ok: boolean;
  status: number;
  error?: string;
  clientIp: string;
}

interface RateWindowEntry {
  timestamps: number[];
}

const BUCKET_LIMITS: Record<RequestBucket, { maxRequests: number; windowMs: number }> = {
  read: { maxRequests: 120, windowMs: 60_000 },
  mutation: { maxRequests: 25, windowMs: 60_000 },
  upload: { maxRequests: 10, windowMs: 60_000 },
};

const MAX_TRACKED_KEYS = 1000;
const rateLimitStore = new Map<string, RateWindowEntry>();

function pruneStore(now: number, maxWindowMs: number): void {
  if (rateLimitStore.size < MAX_TRACKED_KEYS) return;
  for (const [key, entry] of rateLimitStore.entries()) {
    const active = entry.timestamps.filter((t) => now - t < maxWindowMs);
    if (active.length === 0) {
      rateLimitStore.delete(key);
    } else {
      entry.timestamps = active;
    }
  }
}

function checkRateLimit(clientIp: string, bucket: RequestBucket): boolean {
  const now = Date.now();
  const { maxRequests, windowMs } = BUCKET_LIMITS[bucket];
  pruneStore(now, 60_000);

  const key = `${bucket}:${clientIp}`;
  const existing = rateLimitStore.get(key);
  const recent = existing
    ? existing.timestamps.filter((t) => now - t < windowMs)
    : [];

  if (recent.length >= maxRequests) {
    rateLimitStore.set(key, { timestamps: recent });
    return false;
  }

  recent.push(now);
  rateLimitStore.set(key, { timestamps: recent });
  return true;
}

function extractHost(urlOrOrigin: string): string | null {
  try {
    return new URL(urlOrOrigin).host.toLowerCase();
  } catch {
    return null;
  }
}

export async function guardRequest(bucket: RequestBucket): Promise<GuardResult> {
  let hdrs: Awaited<ReturnType<typeof headers>> | null = null;
  try {
    hdrs = await headers();
  } catch {
    hdrs = null;
  }

  if (!hdrs) {
    return { ok: true, status: 200, clientIp: "server-internal" };
  }

  const forwardedFor = hdrs.get("x-forwarded-for");
  const clientIp =
    (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) ||
    hdrs.get("x-real-ip")?.trim() ||
    "local";

  if (bucket === "mutation" || bucket === "upload") {
    const expectedHost = (
      hdrs.get("x-forwarded-host") ||
      hdrs.get("host") ||
      ""
    )
      .split(",")[0]
      .trim()
      .toLowerCase();

    const origin = hdrs.get("origin");
    const referer = hdrs.get("referer");
    const sourceHost = origin
      ? extractHost(origin)
      : referer
        ? extractHost(referer)
        : null;

    const configuredSecret = process.env.ADMIN_ACTION_SECRET?.trim();
    const providedSecret = hdrs.get("x-admin-action-secret")?.trim();

    if (configuredSecret && providedSecret) {
      if (providedSecret !== configuredSecret) {
        return {
          ok: false,
          status: 401,
          error: "Invalid request verification token.",
          clientIp,
        };
      }
    } else if (expectedHost) {
      if (!sourceHost || sourceHost !== expectedHost) {
        return {
          ok: false,
          status: 403,
          error: "Forbidden: untrusted or missing request origin.",
          clientIp,
        };
      }
    }
  }

  if (!checkRateLimit(clientIp, bucket)) {
    return {
      ok: false,
      status: 429,
      error: "Rate limit exceeded. Please wait before submitting another request.",
      clientIp,
    };
  }

  return { ok: true, status: 200, clientIp };
}
