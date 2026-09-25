import { readSiteContent } from "@/lib/content";
import { AdminStudioEditor } from "@/components/Admin/AdminStudioEditor";

// Content is read from MongoDB, so this route renders per request rather
// than being prerendered at build time with a snapshot of the data.
export const dynamic = "force-dynamic";

export default async function AdminStudioPage() {
  const content = await readSiteContent();
  return <AdminStudioEditor initialContent={content} />;
}
