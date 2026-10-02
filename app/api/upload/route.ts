import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { signUpload } from "@/lib/cloudinary";

// Hands a signed-in admin what the browser needs to upload an image straight
// to Cloudinary. proxy.ts already guards this path; the session is checked
// again here so a change to the proxy matcher can't quietly leave it open.
export async function POST() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(signUpload());
  } catch (error) {
    console.error("Cloudinary signing failed", error);
    const message =
      error instanceof Error ? error.message : "Upload failed. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
