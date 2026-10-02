"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectDetailPage } from "@/components/ProjectDetail/ProjectDetail";
import { EditModeProvider } from "./EditModeProvider";
import { persistContent } from "./persistContent";
import type {
  ProjectDetail,
  ProjectImageRow,
  ProjectMeta,
  SiteContent,
} from "@/lib/content";
import { adminProjectHref, locateProject, projectHref } from "@/lib/projects";

type AdminProjectDetailEditorProps = {
  initialContent: SiteContent;
  categoryId: string;
  projectId: string;
};

/** A brand-new project starts with one empty image row for the admin to fill. */
export function blankProject(index: number): ProjectDetail {
  const suffix = Math.random().toString(36).slice(2, 7);
  const id = `project-${suffix}`;
  return {
    id,
    title: `Untitled project ${index + 1}`,
    meta: { area: "", location: "", year: "", type: "" },
    description: [{ id: `${id}-p1`, text: "Describe the project here." }],
    caption: "",
    rows: [
      {
        id: `${id}-row-1`,
        aspect: 1.78,
        items: [{ id: `${id}-img-1`, src: "", alt: "", span: 1 }],
      },
    ],
  };
}

function AdminProjectDetailEditorInner({
  initialContent,
  categoryId,
  projectId,
}: AdminProjectDetailEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const location = useMemo(
    () => locateProject(content.projects, categoryId, projectId),
    [content, categoryId, projectId]
  );

  const updateAndPersist = useCallback(
    async (updater: (prev: SiteContent) => SiteContent) => {
      const previous = content;
      const updated = updater(previous);
      setContent(updated);
      try {
        await persistContent(updated);
      } catch (err) {
        setContent(previous);
        throw err;
      }
    },
    [content]
  );

  /** Rewrites this project's category, leaving the rest of the tree intact. */
  const updateCategoryProjects = useCallback(
    (change: (projects: ProjectDetail[]) => ProjectDetail[]) =>
      updateAndPersist((prev) => ({
        ...prev,
        projects: {
          ...prev.projects,
          sections: prev.projects.sections.map((section) => ({
            ...section,
            links: section.links.map((link) =>
              link.id === categoryId
                ? { ...link, projects: change(link.projects) }
                : link
            ),
          })),
        },
      })),
    [updateAndPersist, categoryId]
  );

  /** Applies `change` to just this project. */
  const updateProject = useCallback(
    (change: (project: ProjectDetail) => ProjectDetail) =>
      updateCategoryProjects((projects) =>
        projects.map((project) =>
          project.id === projectId ? change(project) : project
        )
      ),
    [updateCategoryProjects, projectId]
  );

  const handleLogoChange = useCallback(
    (next: { src: string; alt: string }) =>
      updateAndPersist((prev) => ({
        ...prev,
        header: { logoSrc: next.src, logoText: next.alt },
      })),
    [updateAndPersist]
  );

  const handleTitleChange = useCallback(
    (title: string) => updateProject((project) => ({ ...project, title })),
    [updateProject]
  );

  const handleMetaChange = useCallback(
    (next: Partial<ProjectMeta>) =>
      updateProject((project) => ({
        ...project,
        meta: { ...project.meta, ...next },
      })),
    [updateProject]
  );

  const handleDescriptionChange = useCallback(
    (id: string, text: string) =>
      updateProject((project) => ({
        ...project,
        description: project.description.map((paragraph) =>
          paragraph.id === id ? { ...paragraph, text } : paragraph
        ),
      })),
    [updateProject]
  );

  const handleCaptionChange = useCallback(
    (caption: string) => updateProject((project) => ({ ...project, caption })),
    [updateProject]
  );

  const handleRowsChange = useCallback(
    (rows: ProjectImageRow[]) =>
      updateProject((project) => ({ ...project, rows })),
    [updateProject]
  );

  const handleAddParagraph = useCallback(
    () =>
      updateProject((project) => ({
        ...project,
        description: [
          ...project.description,
          {
            id: `${project.id}-p${Math.random().toString(36).slice(2, 7)}`,
            text: "New paragraph.",
          },
        ],
      })),
    [updateProject]
  );

  /** Adds a sibling project to this category and navigates to it. */
  async function handleAddProject() {
    if (!location) return;
    const created = blankProject(location.stop.category.projects.length);
    await updateCategoryProjects((projects) => [...projects, created]);
    router.push(adminProjectHref(categoryId, created.id));
    router.refresh();
  }

  /** Removes this project, then lands on whatever is nearest in the sequence. */
  async function handleDeleteProject() {
    if (!location) return;
    const confirmed = window.confirm(
      `Delete “${location.stop.project.title}”? This can't be undone.`
    );
    if (!confirmed) return;

    const fallback = location.next ?? location.previous;
    await updateCategoryProjects((projects) =>
      projects.filter((project) => project.id !== projectId)
    );
    router.push(
      fallback
        ? adminProjectHref(fallback.category.id, fallback.project.id)
        : "/admin/projects"
    );
    router.refresh();
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  // Only reachable in the instant between deleting a project and the router
  // landing on the next one.
  if (!location) {
    return (
      <p className="p-10 text-sm text-stone-500">Loading project…</p>
    );
  }

  return (
    <>
      <ProjectDetailPage
        content={content}
        stop={location.stop}
        previous={location.previous}
        next={location.next}
        onLogoChange={handleLogoChange}
        onTitleChange={handleTitleChange}
        onMetaChange={handleMetaChange}
        onDescriptionChange={handleDescriptionChange}
        onCaptionChange={handleCaptionChange}
        onRowsChange={handleRowsChange}
      />

      <div className="fixed bottom-6 right-6 z-90 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleAddParagraph}
          className="border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow transition-colors hover:bg-stone-50"
        >
          + Paragraph
        </button>
        <button
          type="button"
          onClick={handleAddProject}
          className="border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow transition-colors hover:bg-stone-50"
        >
          + Project
        </button>
        <button
          type="button"
          onClick={handleDeleteProject}
          className="border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 shadow transition-colors hover:bg-red-50"
        >
          Delete project
        </button>
        <Link
          href="/admin/projects"
          className="border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow transition-colors hover:bg-stone-50"
        >
          All projects
        </Link>
        <a
          href={projectHref(categoryId, projectId)}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow transition-colors hover:bg-stone-50"
        >
          View site
        </a>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="bg-stone-900 px-3 py-2 text-xs font-medium text-white shadow transition-colors hover:bg-stone-700 disabled:opacity-60"
        >
          {isLoggingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
    </>
  );
}

export function AdminProjectDetailEditor(props: AdminProjectDetailEditorProps) {
  return (
    <EditModeProvider>
      <AdminProjectDetailEditorInner {...props} />
    </EditModeProvider>
  );
}
