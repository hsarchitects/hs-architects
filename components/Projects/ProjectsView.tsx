"use client";

import Link from "next/link";
import { EditableText } from "@/components/Admin/EditableText";
import { useEditMode } from "@/components/Admin/EditModeContext";
import { ProjectCanvas } from "@/components/ProjectDetail/ProjectCanvas";
import type { ProjectImageRow, ProjectsContent } from "@/lib/content";
import {
  adminProjectHref,
  firstProjectOfCategory,
  projectHref,
} from "@/lib/projects";

type ProjectsViewProps = {
  projects: ProjectsContent;
  onHeadingChange?: (sectionId: string, heading: string) => Promise<void> | void;
  onLinkChange?: (
    sectionId: string,
    linkId: string,
    label: string,
  ) => Promise<void> | void;
  onRowsChange?: (
    sectionId: string,
    rows: ProjectImageRow[],
  ) => Promise<void> | void;
  onAddProject?: (sectionId: string, linkId: string) => Promise<void> | void;
};

/**
 * One centred grid of project thumbnails per discipline, with the discipline
 * and its categories set off in the left margin.
 *
 * The grid is the shared ProjectCanvas, so the admin can resize, remove and
 * re-add tiles here too. Rows are fixed and each holds at most three images,
 * which keeps the grid three across the way the design intends.
 */
export function ProjectsView({
  projects,
  onHeadingChange,
  onLinkChange,
  onRowsChange,
  onAddProject,
}: ProjectsViewProps) {
  const { isEditMode } = useEditMode();

  return (
    <section className="mx-auto w-full max-w-[100rem] px-6 pb-32 sm:px-10">
      {projects.sections.map((section) => (
        <div
          key={section.id}
          className="mt-4 mb-20 lg:grid lg:grid-cols-[1fr_20rem_1fr] lg:items-start lg:gap-8"
        >
          <div className="text-center lg:w-56 lg:justify-self-start">
            <EditableText
              value={section.heading}
              label="Section title"
              showValue
              as="h2"
              className="text-xl font-normal text-stone-900"
              onSave={(next) => onHeadingChange?.(section.id, next)}
            />
            <div className="mt-5 space-y-4">
              {section.links.map((link) => {
                // A category opens its first project; the sequence then walks
                // the whole discipline from there. An empty category has
                // nowhere to go, so it stays plain text.
                const first = firstProjectOfCategory(link);
                const href = first
                  ? (isEditMode ? adminProjectHref : projectHref)(
                      link.id,
                      first.id,
                    )
                  : null;

                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-center gap-1.5"
                  >
                    {href ? (
                      <Link
                        href={href}
                        className="text-sm text-stone-800 transition-colors hover:text-stone-400"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <p className="text-sm text-stone-800">{link.label}</p>
                    )}

                    {/* Label is a link, so the edit control sits beside it. */}
                    <EditableText
                      value={link.label}
                      label="Category"
                      onSave={(next) =>
                        onLinkChange?.(section.id, link.id, next)
                      }
                    />

                    {/* Admin only: an empty category has no project page to
                        add one from, so its first project starts here. */}
                    {!href && onAddProject && (
                      <button
                        type="button"
                        onClick={() => onAddProject(section.id, link.id)}
                        title="Add the first project to this category"
                        className="border border-stone-300 bg-white px-1.5 py-1 text-[0.65rem] font-medium text-stone-600 transition-colors hover:border-stone-500 hover:text-stone-900"
                      >
                        + Project
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 w-full max-w-100 justify-self-center lg:mt-0 lg:max-w-none">
            <ProjectCanvas
              rows={section.rows}
              onRowsChange={
                onRowsChange && ((rows) => onRowsChange(section.id, rows))
              }
              gap="0.375rem"
              imageSizes="(min-width: 1024px) 7rem, 30vw"
              allowAddImages
              allowAddRows={false}
              maxItemsPerRow={3}
              expandable
            />
          </div>

          <div aria-hidden="true" className="hidden lg:block" />
        </div>
      ))}
    </section>
  );
}
