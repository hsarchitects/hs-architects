import { notFound } from "next/navigation";
import { readLatestSiteContent } from "@/lib/content";
import { locateProject } from "@/lib/projects";
import { AdminProjectDetailEditor } from "@/components/Admin/AdminProjectDetailEditor";

// Content is read from MongoDB, so this route renders per request rather
// than being prerendered at build time with a snapshot of the data.
export const dynamic = "force-dynamic";

export default async function AdminProjectPage({
  params,
}: PageProps<"/admin/projects/[category]/[project]">) {
  const { category, project } = await params;
  const content = await readLatestSiteContent();

  if (!locateProject(content.projects, category, project)) notFound();

  return (
    <AdminProjectDetailEditor
      initialContent={content}
      categoryId={category}
      projectId={project}
    />
  );
}
