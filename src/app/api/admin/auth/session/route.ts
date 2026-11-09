import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { ADMIN_SESSION_COOKIE, isAdminEmail } from "@/lib/security/auth-guard";

const FIVE_DAYS_MS = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";

    if (!idToken) {
      return NextResponse.json(
        { error: "Missing Firebase ID token." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // If Firebase Admin credentials are not set (local dev dry-run mode)
    if (!isFirebaseAdminConfigured() || !adminAuth) {
      cookieStore.set(ADMIN_SESSION_COOKIE, "dev-session-token", {
        maxAge: FIVE_DAYS_MS / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
      });
      return NextResponse.json({
        success: true,
        email: "admin@pokeiring.app",
        mode: "development",
      });
    }

    // Verify token validity and inspect admin role
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email || "";

    const hasAdminClaim = Boolean(
      decoded.admin === true || decoded.role === "admin"
    );
    const hasAdminRole = isAdminEmail(email);

    if (!hasAdminClaim && !hasAdminRole) {
      return NextResponse.json(
        {
          error:
            "Forbidden: This account lacks administrative privileges (@iring.ph or admin@pokeiring.app required).",
        },
        { status: 403 }
      );
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: FIVE_DAYS_MS,
    });

    cookieStore.set(ADMIN_SESSION_COOKIE, sessionCookie, {
      maxAge: FIVE_DAYS_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      email,
    });
  } catch (err) {
    console.error("Failed to establish admin session:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create verified admin session.",
      },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
