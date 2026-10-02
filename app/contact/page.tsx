import { readSiteContent } from "@/lib/content";
import { Contact } from "@/components/Contact/Contact";

// Content is read from MongoDB, so this route renders per request rather
// than being prerendered at build time with a snapshot of the data.
export const dynamic = "force-dynamic";

export const metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const content = await readSiteContent();
  return <Contact content={content} />;
}
