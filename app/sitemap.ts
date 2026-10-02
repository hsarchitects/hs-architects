import type { MetadataRoute } from "next";
import { readSiteContent } from "@/lib/content";
import { allProjectStops, projectHref } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";

// Projects come from MongoDB, so this is built per request like the pages.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await readSiteContent();
  const paths = [
    "/",
    "/studio",
    "/about",
    "/projects",
    "/contact",
    ...allProjectStops(content.projects).map((stop) =>
      projectHref(stop.category.id, stop.project.id)
    ),
  ];
  return paths.map((path) => ({ url: `${SITE_URL}${path}` }));
}
