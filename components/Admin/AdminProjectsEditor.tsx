"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Projects } from "@/components/Projects/Projects";
import { EditModeProvider } from "./EditModeProvider";
import { persistContent } from "./persistContent";
import type { ProjectImageRow, ProjectSection, SiteContent } from "@/lib/content";

function AdminProjectsEditorInner({ initialContent }: { initialContent: SiteContent }) {
  const router = useRouter();
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
