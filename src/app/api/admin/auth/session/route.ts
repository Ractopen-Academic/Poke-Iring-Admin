import { NextResponse } from "next/server";
import { getAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { ADMIN_SESSION_COOKIE, isAdminEmail } from "@/lib/security/auth-guard";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5; // 5 days

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: unknown };
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";

    if (!idToken) {
      return NextResponse.json(
        { error: "Missing Firebase ID token." },
        { status: 400 }
      );
    }

    const adminAuth = await getAdminAuth();
    if (!isFirebaseAdminConfigured() || !adminAuth) {
      return NextResponse.json(
        { error: "Firebase Admin SDK is not configured on the server." },
        { status: 503 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const hasAdminClaim = Boolean(
      decoded.admin === true || decoded.role === "admin"
    );
    if (!hasAdminClaim && !isAdminEmail(decoded.email)) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Account lacks administrative privileges (@iring.ph or admin@pokeiring.app).",
        },
        { status: 403 }
      );
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Admin session creation failed", error);
    return NextResponse.json(
      { error: "Authentication failed. Invalid or expired token." },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}
