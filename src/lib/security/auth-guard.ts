import "server-only";
import { cookies } from "next/headers";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const ADMIN_SESSION_COOKIE = "admin_session";

export interface AdminUser {
  uid: string;
  email: string;
  name?: string;
}

export interface AuthVerificationResult {
  ok: boolean;
  user?: AdminUser;
  error?: string;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith("@iring.ph") ||
    normalized === "admin@pokeiring.app" ||
    normalized.endsWith("@admin.pokeiring.com") ||
    normalized.endsWith("@admin.com")
  );
}

export async function verifyAdminSession(): Promise<AuthVerificationResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    // If running in development without Firebase credentials configured yet
    if (!isFirebaseAdminConfigured()) {
      return {
        ok: true,
        user: {
          uid: "dev-admin-uid",
          email: "admin@pokeiring.app",
          name: "Local Dev Admin",
        },
      };
    }
    return { ok: false, error: "Authentication required. Please log in." };
  }

  if (!isFirebaseAdminConfigured() || !adminAuth) {
    return {
      ok: true,
      user: {
        uid: "dev-admin-uid",
        email: "admin@pokeiring.app",
        name: "Local Dev Admin",
      },
    };
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const email = decoded.email || "";

    const hasAdminClaim = Boolean(
      decoded.admin === true || decoded.role === "admin"
    );
    const hasAdminEmail = isAdminEmail(email);

    if (!hasAdminClaim && !hasAdminEmail) {
      return {
        ok: false,
        error: "Forbidden: Account lacks administrative privileges (@iring.ph or admin@pokeiring.app).",
      };
    }

    return {
      ok: true,
      user: {
        uid: decoded.uid,
        email,
        name: decoded.name,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Invalid or expired session.",
    };
  }
}
