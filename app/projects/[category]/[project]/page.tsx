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
  if (!location) return {};

  const { project: detail } = location.stop;
  // First paragraph and first image that actually have something in them.
  const description = detail.description.find((p) => p.text.trim())?.text;
  const image = detail.rows.flatMap((row) => row.items).find((item) => item.src);
  return {
    title: detail.title,
    description,
    openGraph: {
      title: detail.title,
      description,
      images: image && [{ url: image.src, alt: image.alt }],
    },
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
