"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Contact } from "@/components/Contact/Contact";
import { EditModeProvider } from "./EditModeProvider";
import { useContentEditor } from "./useContentEditor";
import type { SiteContent } from "@/lib/content";

function AdminContactEditorInner({ initialContent }: { initialContent: SiteContent }) {
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

  const handleIntroChange = useCallback(
    (text: string) =>
      updateAndPersist((prev) => ({
        ...prev,
        contact: { ...prev.contact, intro: text },
      })),
    [updateAndPersist]
  );

  const handleDetailChange = useCallback(
    (id: string, next: { label?: string; value?: string }) =>
      updateAndPersist((prev) => ({
        ...prev,
        contact: {
          ...prev.contact,
          details: prev.contact.details.map((detail) =>
            detail.id === id ? { ...detail, ...next } : detail
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
      <Contact
        content={content}
        onLogoChange={handleLogoChange}
        onIntroChange={handleIntroChange}
        onDetailChange={handleDetailChange}
      />

      <div className="fixed bottom-6 right-6 z-90 flex gap-2">
        <a
          href="/admin"
          className="border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow transition-colors hover:bg-stone-50"
        >
          Home
        </a>
        <a
          href="/contact"
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

export function AdminContactEditor({ initialContent }: { initialContent: SiteContent }) {
  return (
    <EditModeProvider>
      <AdminContactEditorInner initialContent={initialContent} />
    </EditModeProvider>
  );
}
