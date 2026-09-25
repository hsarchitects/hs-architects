import { notFound } from "next/navigation";
import { readSiteContent } from "@/lib/content";
import { locateProject } from "@/lib/projects";
import { ProjectDetailPage } from "@/components/ProjectDetail/ProjectDetail";

// Content is read from MongoDB, so this route renders per request rather
// than being prerendered at build time with a snapshot of the data.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/projects/[category]/[project]">) {
  const { category, project } = await params;
  const content = await readSiteContent();
  const location = locateProject(content.projects, category, project);
  if (!location) return { title: "HS Architects" };
  return {
    title: `${location.stop.project.title} — HS Architects`,
    description: location.stop.project.description[0]?.text,
  };
}

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[category]/[project]">) {
  const { category, project } = await params;
  const content = await readSiteContent();
  const location = locateProject(content.projects, category, project);

  if (!location) notFound();

  return (
    <ProjectDetailPage
      content={content}
      stop={location.stop}
      previous={location.previous}
      next={location.next}
    />
  );
}
