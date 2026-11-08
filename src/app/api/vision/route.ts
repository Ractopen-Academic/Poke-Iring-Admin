import { NextResponse } from "next/server";
import { guardRequest } from "@/lib/security/request-guard";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  const guard = await guardRequest("vision");
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status, headers: CORS_HEADERS }
    );
  }

  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Gemini Vision proxy is unconfigured. Set GEMINI_API_KEY in server environment variables.",
      },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  let base64Data = "";
  let mimeType = "image/jpeg";

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const fileEntry = formData.get("file") || formData.get("image");
      if (!(fileEntry instanceof File)) {
        return NextResponse.json(
          { ok: false, error: "No image file provided in form data." },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      mimeType = fileEntry.type || "image/jpeg";
      const buffer = Buffer.from(await fileEntry.arrayBuffer());
      base64Data = buffer.toString("base64");
    } catch {
      return NextResponse.json(
        { ok: false, error: "Failed to parse multipart form data." },
        { status: 400, headers: CORS_HEADERS }
      );
    }
  } else {
    try {
      const body = (await request.json()) as {
        imageBase64?: string;
        mimeType?: string;
      };
      if (!body.imageBase64 || typeof body.imageBase64 !== "string") {
        return NextResponse.json(
          { ok: false, error: "Invalid payload: missing imageBase64 field." },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      base64Data = body.imageBase64;
      if (body.mimeType) {
        mimeType = body.mimeType;
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "Failed to parse JSON body." },
        { status: 400, headers: CORS_HEADERS }
      );
    }
  }

  const prompt = `You are an expert feline biologist and Pokemon-style game vision analyzer for the Poke: Iring game.
Inspect this image and determine if there is a cat visible.
Return ONLY valid JSON matching this exact structure:
{
  "is_cat": true,
  "confidence": 0.98,
  "breed": "Domestic Shorthair (Puspin)",
  "coat_pattern": "Calico",
  "dominant_color": "Orange and White",
  "rarity_multiplier": 1.4,
  "pattern_bonus_pts": 35,
  "quirk": "Majestic street guardian observing the neighborhood from a sunny brick stoop.",
  "box_2d": [180, 220, 840, 780]
}

Guidelines:
- "is_cat": boolean. Set to false if no feline is present.
- "breed": Use standard breeds. For local stray cats in the Philippines, identify as "Domestic Shorthair (Puspin)" or standard breeds like "Persian", "Siamese", "Bengal", "British Shorthair", "Ragdoll", "Scottish Fold", "Russian Blue".
- "coat_pattern": "Calico", "Tuxedo", "Orange Tabby", "Brown Tabby", "Tortoiseshell", "Solid Black", "Solid White", "Bicolor", or "Colorpoint".
- "rarity_multiplier": 1.0 (common), 1.2-1.5 (distinctive markings/patterns like Calico, Tuxedo), 1.6-2.0 (rare or purebred).
- "pattern_bonus_pts": 10 to 40 bonus points.
- "box_2d": [ymin, xmin, ymax, xmax] as integers normalized from 0 to 1000 representing the bounding box of the primary cat. If not a cat, set to null.
- "quirk": Exactly one humorous, charming, or endearing explorer journal observation sentence about what the cat is doing.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          response_mime_type: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          ok: false,
          error: `Upstream Gemini API error: ${response.status}`,
          details: errorText,
        },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const data = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!candidateText) {
      return NextResponse.json(
        { ok: false, error: "Empty candidate text returned by model." },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const parsedJson = JSON.parse(candidateText);
    return NextResponse.json(
      { ok: true, data: parsedJson },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: `Inference failed: ${message}` },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
