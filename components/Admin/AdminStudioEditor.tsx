"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Studio } from "@/components/Studio/Studio";
import { EditModeProvider } from "./EditModeProvider";
import { persistContent } from "./persistContent";
import type { SiteContent } from "@/lib/content";

function AdminStudioEditorInner({ initialContent }: { initialContent: SiteContent }) {
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

  const handleLogoChange = useCallback(
    (next: { src: string; alt: string }) =>
      updateAndPersist((prev) => ({
        ...prev,
        header: { logoSrc: next.src, logoText: next.alt },
      })),
    [updateAndPersist]
  );

  const handleIntroChange = useCallback(
    (id: string, text: string) =>
      updateAndPersist((prev) => ({
        ...prev,
        studio: {
          ...prev.studio,
          intro: prev.studio.intro.map((block) =>
            block.id === id ? { ...block, text } : block
          ),
        },
      })),
    [updateAndPersist]
  );

  const handlePrincipleChange = useCallback(
    (id: string, next: { heading?: string; text?: string }) =>
      updateAndPersist((prev) => ({
        ...prev,
        studio: {
          ...prev.studio,
          principles: prev.studio.principles.map((principle) =>
            principle.id === id ? { ...principle, ...next } : principle
          ),
        },
      })),
    [updateAndPersist]
  );

  const handleStudioImageChange = useCallback(
    (id: string, next: { src: string; alt: string }) =>
      updateAndPersist((prev) => ({
        ...prev,
        studio: {
          ...prev.studio,
          images: prev.studio.images.map((image) =>
            image.id === id ? { ...image, ...next } : image
          ),
        },
      })),
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
      <Studio
        content={content}
        onLogoChange={handleLogoChange}
        onIntroChange={handleIntroChange}
        onPrincipleChange={handlePrincipleChange}
        onStudioImageChange={handleStudioImageChange}
      />

      <div className="fixed bottom-6 right-6 z-90 flex gap-2">
        <a
          href="/admin"
          className="border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow transition-colors hover:bg-stone-50"
        >
          Home
        </a>
        <a
          href="/studio"
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

export function AdminStudioEditor({ initialContent }: { initialContent: SiteContent }) {
  return (
    <EditModeProvider>
      <AdminStudioEditorInner initialContent={initialContent} />
    </EditModeProvider>
  );
}
