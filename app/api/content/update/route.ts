import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  CONTENT_CACHE_TAG,
  ContentConflictError,
  writeSiteContent,
  type SiteContent,
} from "@/lib/content";

/** The whole tree is ~30KB of text; anything near this isn't site content. */
const MAX_BODY_CHARS = 1_000_000;

// proxy.ts already guards this path; the session is checked again here so a
// change to the proxy matcher can't quietly leave writes open.
export async function PATCH(request: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "Content is too large" }, { status: 413 });
  }

  let body: SiteContent;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const version = await writeSiteContent(body);
    // Drop the public pages' cached copy so the edit shows on the next visit.
    revalidateTag(CONTENT_CACHE_TAG, { expire: 0 });
    return NextResponse.json({ ok: true, version });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid content";
    return NextResponse.json(
      { error: message },
      { status: error instanceof ContentConflictError ? 409 : 400 }
    );
  }
}
