"use client";

import type { SiteContent } from "@/lib/content";
import { Header } from "@/components/Landing/Header";
import type { ProjectStop } from "@/lib/projects";
import {
  ProjectDetailView,
  type ProjectDetailHandlers,
} from "./ProjectDetailView";

type ProjectDetailPageProps = {
  content: SiteContent;
  stop: ProjectStop;
  previous: ProjectStop | null;
  next: ProjectStop | null;
  onLogoChange?: (next: { src: string; alt: string }) => Promise<void> | void;
} & ProjectDetailHandlers;

/**
 * The public project page shell. Rendered as-is on
 * /projects/[category]/[project], and wrapped in EditModeProvider by the
 * admin editor — same reuse pattern as Landing/Studio/About.
 */
export function ProjectDetailPage({
  content,
  stop,
  previous,
  next,
  onLogoChange,
  ...handlers
}: ProjectDetailPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:h-screen lg:overflow-hidden">
      <Header
        logoSrc={content.header.logoSrc}
        logoText={content.header.logoText}
        onLogoChange={onLogoChange}
      />
      <ProjectDetailView
        project={stop.project}
        previous={previous}
        next={next}
        {...handlers}
      />
    </div>
  );
}
