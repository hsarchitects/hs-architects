"use client";

import type { ProjectImageRow, SiteContent } from "@/lib/content";
import { Header } from "@/components/Landing/Header";
import { ProjectsView } from "./ProjectsView";

type ProjectsProps = {
  content: SiteContent;
  onLogoChange?: (next: { src: string; alt: string }) => Promise<void> | void;
  onHeadingChange?: (sectionId: string, heading: string) => Promise<void> | void;
  onLinkChange?: (
    sectionId: string,
    linkId: string,
    label: string
  ) => Promise<void> | void;
  onSectionRowsChange?: (
    sectionId: string,
    rows: ProjectImageRow[]
  ) => Promise<void> | void;
  onAddProject?: (sectionId: string, linkId: string) => Promise<void> | void;
};

/**
 * The public Projects page shell. Rendered as-is on /projects, and wrapped in
 * EditModeProvider on /admin/projects — same reuse pattern as the other pages.
 */
export function Projects({
  content,
  onLogoChange,
  onHeadingChange,
  onLinkChange,
  onSectionRowsChange,
  onAddProject,
}: ProjectsProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header
        logoSrc={content.header.logoSrc}
        logoText={content.header.logoText}
        onLogoChange={onLogoChange}
      />
      <ProjectsView
        projects={content.projects}
        onHeadingChange={onHeadingChange}
        onLinkChange={onLinkChange}
        onRowsChange={onSectionRowsChange}
        onAddProject={onAddProject}
      />
    </div>
  );
}
