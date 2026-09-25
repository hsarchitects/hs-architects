import { NextRequest, NextResponse } from "next/server";
import { writeSiteContent, type SiteContent } from "@/lib/content";

// Protected by proxy.ts (matcher includes /api/content/update) — requires a
// valid admin session cookie.
export async function PATCH(request: NextRequest) {
  let body: SiteContent;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await writeSiteContent(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid content";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
