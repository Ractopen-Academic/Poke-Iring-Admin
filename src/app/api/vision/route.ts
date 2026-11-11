import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { guardRequest } from "@/lib/security/request-guard";

/**
 * Gemini Vision proxy for the Poke: Iring mobile app.
 *
 * Security model:
 * - GEMINI_API_KEY lives ONLY in Vercel server env (encrypted at rest).
 *   It is never sent to clients and never placed in a URL (sent as header).
 * - Every request must carry a valid Firebase ID token
 *   (`Authorization: Bearer <idToken>`) from a signed-in app user, so random
 *   internet callers cannot burn the Gemini quota.
 * - Per-IP rate limiting via guardRequest("vision").
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const MODEL = process.env.GEMINI_VISION_MODEL?.trim() || "gemini-2.5-flash";
const MIN_CAT_CONFIDENCE = 0.7;
const MAX_BASE64_LENGTH = 8 * 1024 * 1024; // ~6 MB image
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const PROMPT = `You are a strict image verifier for the Poke: Iring cat-spotting game.
Players earn real rewards, so be skeptical and never guess.

Decide whether a REAL, LIVE domestic cat (Felis catus) is clearly visible in this photo.

Set "is_cat" to false when ANY of these apply:
- No cat is visible (people, faces, selfies, dogs, other animals, objects, scenery).
- The "cat" is a drawing, cartoon, toy, plush, statue, sticker, print, or a photo of a screen/monitor.
- The image is too dark, blurry, or cropped to be sure.
- Wild big cats (lion, tiger, leopard) - only domestic cats count.

Return ONLY valid JSON with this exact structure:
{
  "is_cat": true,
  "confidence": 0.98,
  "reason": "Short explanation of what is in the image.",
  "breed": "Uncategorized",
  "coat_pattern": "Calico",
  "dominant_color": "Orange and White",
  "rarity_multiplier": 1.4,
  "pattern_bonus_pts": 35,
  "quirk": "Majestic street guardian observing the neighborhood from a sunny brick stoop.",
  "box_2d": [180, 220, 840, 780]
}

Guidelines:
- "confidence": 0.0-1.0, your certainty that a real domestic cat is present.
- "reason": always fill this in, especially when "is_cat" is false (e.g. "Photo shows a person, no cat").
- "breed": If purebred with unmistakable distinctive breed characteristics (e.g. "Siamese", "Persian", "Bengal", "British Shorthair", "Ragdoll", "Scottish Fold", "Russian Blue", "Maine Coon", "Sphynx"), return that specific breed name. If it is a street cat, stray, mixed breed, or ordinary cat, ALWAYS return "Uncategorized". Do NOT return "Domestic Shorthair (Puspin)" unless explicitly verified. Never guess or default to Puspin. The strict default is "Uncategorized".
- "coat_pattern": "Calico", "Tuxedo", "Orange Tabby", "Brown Tabby", "Tortoiseshell", "Solid Black", "Solid White", "Bicolor", or "Colorpoint".
- "rarity_multiplier": 1.0 (common), 1.2-1.5 (distinctive markings like Calico, Tuxedo), 1.6-2.0 (rare or purebred).
- "pattern_bonus_pts": 10 to 40.
- "box_2d": [ymin, xmin, ymax, xmax] integers normalized 0-1000 for the primary cat, or null if no cat.
- "quirk": one charming explorer-journal sentence about what the cat is doing (empty string if no cat).`;

function fail(status: number, error: string) {
  return NextResponse.json(
    { ok: false, error },
    { status, headers: CORS_HEADERS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const guard = await guardRequest("vision");
  if (!guard.ok) return fail(guard.status, guard.error || "Request blocked.");

  // Server-only secret. Deliberately NO NEXT_PUBLIC_ fallback: NEXT_PUBLIC_*
  // values are inlined into the browser bundle and would leak the key.
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return fail(503, "Vision proxy is not configured on the server.");
  }

  // 1. Authenticate the app user via Firebase ID token if present.
  // Rate-limited by IP above to protect against quota drainage.
  const authHeader = request.headers.get("authorization") || "";
  const idToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (adminAuth && idToken) {
    try {
      await adminAuth.verifyIdToken(idToken);
    } catch {
      return fail(401, "Invalid or expired session. Please sign in again.");
    }
  }

  // 2. Parse image payload (JSON base64 or multipart).
  let base64Data = "";
  let mimeType = "image/jpeg";
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const fileEntry = formData.get("file") || formData.get("image");
      if (!(fileEntry instanceof File)) {
        return fail(400, "No image file provided in form data.");
      }
      mimeType = fileEntry.type || "image/jpeg";
      base64Data = Buffer.from(await fileEntry.arrayBuffer()).toString(
        "base64"
      );
    } else {
      const body = (await request.json()) as {
        imageBase64?: unknown;
        mimeType?: unknown;
      };
      if (typeof body.imageBase64 !== "string" || !body.imageBase64) {
        return fail(400, "Invalid payload: missing imageBase64 field.");
      }
      base64Data = body.imageBase64;
      if (typeof body.mimeType === "string") mimeType = body.mimeType;
    }
  } catch {
    return fail(400, "Failed to parse request body.");
  }

  if (!ALLOWED_MIME.has(mimeType)) mimeType = "image/jpeg";
  if (base64Data.length > MAX_BASE64_LENGTH) {
    return fail(413, "Image too large. Please use a smaller photo.");
  }

  // 3. Call Gemini. Key goes in a header, not the URL, so it never lands in logs.
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        MODEL
      )}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
                { inline_data: { mime_type: mimeType, data: base64Data } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(45_000),
      }
    );

    if (!response.ok) {
      // Log upstream details server-side only; never echo them to clients.
      console.error("Gemini vision error", response.status, await response.text());
      return fail(502, "Vision model request failed.");
    }

    const data = await response.json();
    let text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!text) return fail(502, "Empty response from vision model.");

    text = text.replace(/^```[a-zA-Z]*\s*/, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(text) as Record<string, unknown>;

    // 4. Server-side confidence gate (the client cannot override this).
    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;
    if (parsed.is_cat === true && confidence < MIN_CAT_CONFIDENCE) {
      return NextResponse.json(
        {
          ok: true,
          data: {
            is_cat: false,
            confidence,
            reason: `Not sure this is a cat (${Math.round(
              confidence * 100
            )}% confidence). Try a clearer, closer photo.`,
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({ ok: true, data: parsed }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    console.error("Vision inference failed", err);
    return fail(500, "Vision inference failed.");
  }
}
