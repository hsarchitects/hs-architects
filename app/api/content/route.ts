import { NextResponse } from "next/server";
import { readSiteContent } from "@/lib/content";

export async function GET() {
  try {
    const content = await readSiteContent();
    return NextResponse.json(content);
  } catch (error) {
    console.error("Failed to read site content", error);
    return NextResponse.json(
      { error: "Failed to load site content" },
      { status: 500 }
    );
  }
}
