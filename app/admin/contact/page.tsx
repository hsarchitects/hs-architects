import { readLatestSiteContent } from "@/lib/content";
import { AdminContactEditor } from "@/components/Admin/AdminContactEditor";

// Content is read from MongoDB, so this route renders per request rather
// than being prerendered at build time with a snapshot of the data.
export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const content = await readLatestSiteContent();
  return <AdminContactEditor initialContent={content} />;
}
