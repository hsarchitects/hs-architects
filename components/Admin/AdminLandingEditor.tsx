"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Landing } from "@/components/Landing/Landing";
import { EditModeProvider } from "./EditModeProvider";
import { useContentEditor } from "./useContentEditor";
import type { ProjectImageRow, SiteContent } from "@/lib/content";

function AdminLandingEditorInner({ initialContent }: { initialContent: SiteContent }) {
  const router = useRouter();
  const [content, updateAndPersist] = useContentEditor(initialContent);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoChange = useCallback(
    (next: { src: string; alt: string }) =>
      updateAndPersist((prev) => ({
        ...prev,
        header: { logoSrc: next.src, logoText: next.alt },
      })),
    [updateAndPersist]
  );

  const handleGalleryRowsChange = useCallback(
    (rows: ProjectImageRow[]) =>
      updateAndPersist((prev) => ({ ...prev, gallery: { rows } })),
    [updateAndPersist]
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
      <Landing
        content={content}
        onLogoChange={handleLogoChange}
        onGalleryRowsChange={handleGalleryRowsChange}
      />

      <div className="fixed bottom-6 right-6 z-90 flex gap-2">
        <a
          href="/"
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

export function AdminLandingEditor({ initialContent }: { initialContent: SiteContent }) {
  return (
    <EditModeProvider>
      <AdminLandingEditorInner initialContent={initialContent} />
    </EditModeProvider>
  );
}
