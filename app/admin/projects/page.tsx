import { readSiteContent } from "@/lib/content";
import { AdminProjectsEditor } from "@/components/Admin/AdminProjectsEditor";

// Content is read from MongoDB, so this route renders per request rather
// than being prerendered at build time with a snapshot of the data.
export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const content = await readSiteContent();
  return <AdminProjectsEditor initialContent={content} />;
}
