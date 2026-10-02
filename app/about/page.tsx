import { readSiteContent } from "@/lib/content";
import { About } from "@/components/About/About";

// Content is read from MongoDB, so this route renders per request rather
// than being prerendered at build time with a snapshot of the data.
export const dynamic = "force-dynamic";

export const metadata = { title: "About Us" };

export default async function AboutPage() {
  const content = await readSiteContent();
  return <About content={content} />;
}
