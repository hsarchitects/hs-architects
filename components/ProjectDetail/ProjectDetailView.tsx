"use client";

import Link from "next/link";
import { EditableText } from "@/components/Admin/EditableText";
import { useEditMode } from "@/components/Admin/EditModeContext";
import type { ProjectDetail, ProjectImageRow, ProjectMeta } from "@/lib/content";
import { adminProjectHref, projectHref, type ProjectStop } from "@/lib/projects";
import { ProjectCanvas } from "./ProjectCanvas";

export type ProjectDetailHandlers = {
  onTitleChange?: (title: string) => Promise<void> | void;
  onMetaChange?: (next: Partial<ProjectMeta>) => Promise<void> | void;
  onDescriptionChange?: (id: string, text: string) => Promise<void> | void;
  onCaptionChange?: (caption: string) => Promise<void> | void;
  onRowsChange?: (rows: ProjectImageRow[]) => Promise<void> | void;
};

type ProjectDetailViewProps = {
  project: ProjectDetail;
  previous: ProjectStop | null;
  next: ProjectStop | null;
} & ProjectDetailHandlers;

const META_FIELDS: { key: keyof ProjectMeta; label: string }[] = [
  { key: "area", label: "Area" },
  { key: "location", label: "Location" },
  { key: "year", label: "Year" },
  { key: "type", label: "Type" },
];

function ArrowLeft() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="8" />
      <path d="M11.5 6.5 8 10l3.5 3.5" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="8" />
      <path d="M8.5 6.5 12 10l-3.5 3.5" />
    </svg>
  );
}

const NAV_LINK =
  "flex items-center gap-2 text-sm text-stone-400 transition-colors hover:text-stone-900";

/**
 * A single project. On large screens the two outer columns are pinned and
 * only the image canvas between them scrolls; below that everything stacks
 * and flows normally, since nothing can usefully stay fixed on a phone.
 *
 * The Previous/Next bar sits at the end of the scrolling column — it's the
 * last thing you reach, not a floating chrome element.
 */
export function ProjectDetailView({
  project,
  previous,
  next,
  onTitleChange,
  onMetaChange,
  onDescriptionChange,
  onCaptionChange,
  onRowsChange,
}: ProjectDetailViewProps) {
  const { isEditMode } = useEditMode();
  // While editing, the sequence links go to the editable versions of those
  // pages, matching how the Header swaps its nav to editHrefs.
  const hrefFor = isEditMode ? adminProjectHref : projectHref;
  const allProjectsHref = isEditMode ? "/admin/projects" : "/projects";

  return (
    <div className="mx-auto grid w-full max-w-[100rem] gap-8 px-6 pb-16 sm:px-10 lg:h-[calc(100svh-7rem)] lg:grid-cols-[14rem_1fr_17rem] lg:gap-10 lg:overflow-hidden lg:pb-6">
      {/* Left — title and specification, pinned. */}
      <aside className="lg:overflow-y-auto lg:pb-6">
        <EditableText
          value={project.title}
          label="Project title"
          showValue
          as="h1"
          className="text-3xl font-light leading-tight tracking-tight text-stone-900"
          onSave={(nextTitle) => onTitleChange?.(nextTitle)}
        />

        <dl className="mt-10 space-y-6">
          {META_FIELDS.map((field) => (
            <div key={field.key}>
              <dt className="text-[0.7rem] uppercase tracking-widest text-stone-400">
                {field.label}
              </dt>
              <dd className="mt-1.5">
                <EditableText
                  value={project.meta[field.key]}
                  label={field.label}
                  showValue
                  as="span"
                  className="text-sm text-stone-900"
                  onSave={(value) => onMetaChange?.({ [field.key]: value })}
                />
              </dd>
            </div>
          ))}
        </dl>
      </aside>

      {/* Centre — the only column that scrolls. */}
      <main className="min-w-0 lg:overflow-y-auto lg:pb-6">
        <ProjectCanvas rows={project.rows} onRowsChange={onRowsChange} />

        <nav
          aria-label="Project navigation"
          className="mt-8 grid grid-cols-3 items-center gap-4 border-t border-stone-100 pt-5"
        >
          {previous ? (
            <Link
              href={hrefFor(previous.category.id, previous.project.id)}
              className={NAV_LINK}
            >
              <ArrowLeft />
              <span>Previous</span>
            </Link>
          ) : (
            <Link href={allProjectsHref} className={NAV_LINK}>
              <ArrowLeft />
              <span>Projects</span>
            </Link>
          )}

          <EditableText
            value={project.caption}
            label="Caption"
            showValue
            as="p"
            className="text-center text-sm italic text-stone-600"
            onSave={(caption) => onCaptionChange?.(caption)}
          />

          {next ? (
            <Link
              href={hrefFor(next.category.id, next.project.id)}
              className={`${NAV_LINK} justify-self-end`}
            >
              <span>Next</span>
              <ArrowRight />
            </Link>
          ) : (
            <Link
              href={allProjectsHref}
              className={`${NAV_LINK} justify-self-end`}
            >
              <span>All projects</span>
              <ArrowRight />
            </Link>
          )}
        </nav>
      </main>

      {/* Right — description, pinned. */}
      <aside className="space-y-5 lg:overflow-y-auto lg:pb-6">
        {project.description.map((paragraph) => (
          <EditableText
            key={paragraph.id}
            value={paragraph.text}
            label="Paragraph"
            showValue
            as="p"
            multiline
            className="text-sm leading-relaxed text-stone-700"
            onSave={(text) => onDescriptionChange?.(paragraph.id, text)}
          />
        ))}
      </aside>
    </div>
  );
}
