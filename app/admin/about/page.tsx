import { readLatestSiteContent } from "@/lib/content";
import { AdminAboutEditor } from "@/components/Admin/AdminAboutEditor";

// Content is read from MongoDB, so this route renders per request rather
// than being prerendered at build time with a snapshot of the data.
export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const content = await readLatestSiteContent();
  return <AdminAboutEditor initialContent={content} />;
}
