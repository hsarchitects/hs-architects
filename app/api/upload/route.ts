import { NextRequest, NextResponse } from "next/server";
import { uploadBuffer } from "@/lib/cloudinary";

// Protected by proxy.ts (matcher includes /api/upload) — requires a valid
// admin session cookie.

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File is too large (max 8MB)" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadBuffer(buffer, file.name);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Cloudinary upload failed", error);
    const message =
      error instanceof Error ? error.message : "Upload failed. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
