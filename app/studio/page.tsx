import { readSiteContent } from "@/lib/content";
import { Studio } from "@/components/Studio/Studio";

// Content is read from MongoDB, so this route renders per request rather
// than being prerendered at build time with a snapshot of the data.
export const dynamic = "force-dynamic";

export const metadata = { title: "Studio" };

export default async function StudioPage() {
  const content = await readSiteContent();
  return <Studio content={content} />;
}
