import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readLatestSiteContent } from "@/lib/content";

// Nothing on the site calls this — it's for inspecting the live content, so
// it's limited to a signed-in admin.
export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const content = await readLatestSiteContent();
    return NextResponse.json(content);
  } catch (error) {
    console.error("Failed to read site content", error);
    return NextResponse.json(
      { error: "Failed to load site content" },
      { status: 500 }
    );
  }
}
