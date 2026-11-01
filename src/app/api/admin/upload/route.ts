import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminStorageBucket, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { guardRequest } from "@/lib/security/request-guard";
import {
  validateEventImageBinary,
  type EventMediaKind,
} from "@/lib/security/validators";

export async function POST(request: Request) {
  const guard = await guardRequest("upload");
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Firebase Admin Storage is not configured. Add service account credentials in .env.local.",
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed multipart upload request." },
      { status: 400 }
    );
  }

  const kindRaw = formData.get("kind");
  if (kindRaw !== "banner" && kindRaw !== "logo") {
    return NextResponse.json(
      { ok: false, error: 'Upload kind must be "banner" or "logo".' },
      { status: 400 }
    );
  }
  const kind: EventMediaKind = kindRaw;

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "No image file provided in upload." },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
  const validation = validateEventImageBinary(bytes, fileEntry.type, kind);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 }
    );
  }

  const bucket = getAdminStorageBucket();
  if (!bucket) {
    return NextResponse.json(
      { ok: false, error: "Firebase Storage bucket is unavailable." },
      { status: 503 }
    );
  }

  try {
    const { mimeType, extension } = validation.data;
    const uniqueSuffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const objectPath = `events/${kind}s/${Date.now()}_${uniqueSuffix}.${extension}`;
    const downloadToken = crypto.randomUUID();

    await bucket.file(objectPath).save(Buffer.from(bytes), {
      resumable: false,
      contentType: mimeType,
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          uploadedVia: "poke-iring-admin",
          mediaKind: kind,
        },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;

    return NextResponse.json({
      ok: true,
      url,
      path: objectPath,
      mimeType,
      size: bytes.byteLength,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? `Storage upload failed: ${err.message}`
            : "Failed to upload event image to Firebase Storage.",
      },
      { status: 500 }
    );
  }
}
