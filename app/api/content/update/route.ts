import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ContentConflictError,
  writeSiteContent,
  type SiteContent,
} from "@/lib/content";

// proxy.ts already guards this path; the session is checked again here so a
// change to the proxy matcher can't quietly leave writes open.
export async function PATCH(request: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SiteContent;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const version = await writeSiteContent(body);
    return NextResponse.json({ ok: true, version });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid content";
    return NextResponse.json(
      { error: message },
      { status: error instanceof ContentConflictError ? 409 : 400 }
    );
  }
}
