import { readSiteContent } from "@/lib/content";
import { AdminLandingEditor } from "@/components/Admin/AdminLandingEditor";

// Content is read from MongoDB, so this route renders per request rather
// than being prerendered at build time with a snapshot of the data.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const content = await readSiteContent();
  return <AdminLandingEditor initialContent={content} />;
}
