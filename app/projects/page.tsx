import { readSiteContent } from "@/lib/content";
import { Projects } from "@/components/Projects/Projects";

// Content is read from MongoDB, so this route renders per request rather
// than being prerendered at build time with a snapshot of the data.
export const dynamic = "force-dynamic";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const content = await readSiteContent();
  return <Projects content={content} />;
}
