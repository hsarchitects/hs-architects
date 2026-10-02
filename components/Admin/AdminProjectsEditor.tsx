"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Projects } from "@/components/Projects/Projects";
import { blankProject } from "./AdminProjectDetailEditor";
import { useEditMode } from "./EditModeContext";
import { EditModeProvider } from "./EditModeProvider";
import { persistContent } from "./persistContent";
import type { ProjectImageRow, ProjectSection, SiteContent } from "@/lib/content";
import { adminProjectHref } from "@/lib/projects";

function AdminProjectsEditorInner({ initialContent }: { initialContent: SiteContent }) {
  const router = useRouter();
  const { showToast } = useEditMode();
  const [content, setContent] = useState(initialContent);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  /** Applies `change` to one section, leaving the rest of the content intact. */
  const updateSection = useCallback(
    (sectionId: string, change: (section: ProjectSection) => ProjectSection) =>
      updateAndPersist((prev) => ({
        ...prev,
        projects: {
          ...prev.projects,
          sections: prev.projects.sections.map((section) =>
            section.id === sectionId ? change(section) : section
          ),
        },
      })),
    [updateAndPersist]
  );

  const handleLogoChange = useCallback(
    (next: { src: string; alt: string }) =>
      updateAndPersist((prev) => ({
        ...prev,
        header: { logoSrc: next.src, logoText: next.alt },
      })),
    [updateAndPersist]
  );

  const handleHeadingChange = useCallback(
    (sectionId: string, heading: string) =>
      updateSection(sectionId, (section) => ({ ...section, heading })),
    [updateSection]
  );

  const handleLinkChange = useCallback(
    (sectionId: string, linkId: string, label: string) =>
      updateSection(sectionId, (section) => ({
        ...section,
        links: section.links.map((link) =>
          link.id === linkId ? { ...link, label } : link
        ),
      })),
    [updateSection]
  );

  const handleSectionRowsChange = useCallback(
    (sectionId: string, rows: ProjectImageRow[]) =>
      updateSection(sectionId, (section) => ({ ...section, rows })),
    [updateSection]
  );

  /**
   * Starts the first project of an empty category and opens it. Without this
   * a category whose last project was deleted has no page to add one from.
   */
  async function handleAddProject(sectionId: string, linkId: string) {
    const created = blankProject(0);
    try {
      await updateSection(sectionId, (section) => ({
        ...section,
        links: section.links.map((link) =>
          link.id === linkId
            ? { ...link, projects: [...link.projects, created] }
            : link
        ),
      }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed", "error");
      return;
    }
    router.push(adminProjectHref(linkId, created.id));
    router.refresh();
  }

  /** Runs a list change and reports it, since these have no editor of their own to do so. */
  async function saveSection(
    sectionId: string,
    change: (section: ProjectSection) => ProjectSection
  ) {
    try {
      await updateSection(sectionId, change);
      showToast("Saved");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed", "error");
    }
  }

  /**
   * Adds a project type to a discipline. Its id — the /projects/<id>/…
   * segment — is taken from the name here and never changes afterwards, so
   * renaming a type later doesn't break links to its projects.
   */
  function handleAddCategory(sectionId: string) {
    const label = window.prompt("Name of the new project type")?.trim();
    if (!label) return;

    // Ids are looked up across every discipline, so they must be unique site-wide.
    const taken = new Set(
      content.projects.sections.flatMap((section) =>
        section.links.map((link) => link.id)
      )
    );
    const slug =
      label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "type";
    let id = slug;
    for (let n = 2; taken.has(id); n += 1) id = `${slug}-${n}`;

    return saveSection(sectionId, (section) => ({
      ...section,
      links: [...section.links, { id, label, projects: [] }],
    }));
  }

  function handleDeleteCategory(sectionId: string, linkId: string) {
    const link = content.projects.sections
      .find((section) => section.id === sectionId)
      ?.links.find((candidate) => candidate.id === linkId);
    if (!link) return;

    const count = link.projects.length;
    const contents =
      count === 0
        ? ""
        : ` and the ${count} project${count === 1 ? "" : "s"} inside it`;
    const confirmed = window.confirm(
      `Delete “${link.label}”${contents}? This can't be undone.`
    );
    if (!confirmed) return;

    return saveSection(sectionId, (section) => ({
      ...section,
      links: section.links.filter((candidate) => candidate.id !== linkId),
    }));
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

  return (
    <>
      <Projects
        content={content}
        onLogoChange={handleLogoChange}
        onHeadingChange={handleHeadingChange}
        onLinkChange={handleLinkChange}
        onSectionRowsChange={handleSectionRowsChange}
        onAddProject={handleAddProject}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <div className="fixed bottom-6 right-6 z-90 flex gap-2">
        <a
          href="/admin"
          className="border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow transition-colors hover:bg-stone-50"
        >
          Home
        </a>
        <a
          href="/projects"
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

export function AdminProjectsEditor({ initialContent }: { initialContent: SiteContent }) {
  return (
    <EditModeProvider>
      <AdminProjectsEditorInner initialContent={initialContent} />
    </EditModeProvider>
  );
}
