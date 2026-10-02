"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { About } from "@/components/About/About";
import { EditModeProvider } from "./EditModeProvider";
import { useContentEditor } from "./useContentEditor";
import type { AboutPerson, SiteContent } from "@/lib/content";

function AdminAboutEditorInner({ initialContent }: { initialContent: SiteContent }) {
  const router = useRouter();
  const [content, updateAndPersist] = useContentEditor(initialContent);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /** Applies `change` to one person, leaving the rest of the content intact. */
  const updatePerson = useCallback(
    (personId: string, change: (person: AboutPerson) => AboutPerson) =>
      updateAndPersist((prev) => ({
        ...prev,
        about: {
          ...prev.about,
          people: prev.about.people.map((person) =>
            person.id === personId ? change(person) : person
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

  const handlePersonFieldChange = useCallback(
    (personId: string, next: { name?: string; role?: string }) =>
      updatePerson(personId, (person) => ({ ...person, ...next })),
    [updatePerson]
  );

  const handleParagraphChange = useCallback(
    (personId: string, paragraphId: string, text: string) =>
      updatePerson(personId, (person) => ({
        ...person,
        paragraphs: person.paragraphs.map((paragraph) =>
          paragraph.id === paragraphId ? { ...paragraph, text } : paragraph
        ),
      })),
    [updatePerson]
  );

  const handleCardChange = useCallback(
    (
      personId: string,
      cardId: string,
      next: { heading?: string; text?: string }
    ) =>
      updatePerson(personId, (person) => ({
        ...person,
        cards: person.cards.map((card) =>
          card.id === cardId ? { ...card, ...next } : card
        ),
      })),
    [updatePerson]
  );

  const handlePortraitChange = useCallback(
    (personId: string, next: { src: string; alt: string }) =>
      updatePerson(personId, (person) => ({
        ...person,
        image: { ...person.image, ...next },
      })),
    [updatePerson]
  );

  const handleTogetherChange = useCallback(
    (next: { eyebrow?: string; text?: string }) =>
      updateAndPersist((prev) => ({
        ...prev,
        about: {
          ...prev.about,
          together: { ...prev.about.together, ...next },
        },
      })),
    [updateAndPersist]
  );

  const handleTogetherLineChange = useCallback(
    (id: string, text: string) =>
      updateAndPersist((prev) => ({
        ...prev,
        about: {
          ...prev.about,
          together: {
            ...prev.about.together,
            lines: prev.about.together.lines.map((line) =>
              line.id === id ? { ...line, text } : line
            ),
          },
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
      <About
        content={content}
        onLogoChange={handleLogoChange}
        onPersonFieldChange={handlePersonFieldChange}
        onParagraphChange={handleParagraphChange}
        onCardChange={handleCardChange}
        onPortraitChange={handlePortraitChange}
        onTogetherChange={handleTogetherChange}
        onTogetherLineChange={handleTogetherLineChange}
      />

      <div className="fixed bottom-6 right-6 z-90 flex gap-2">
        <a
          href="/admin"
          className="border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow transition-colors hover:bg-stone-50"
        >
          Home
        </a>
        <a
          href="/about"
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

export function AdminAboutEditor({ initialContent }: { initialContent: SiteContent }) {
  return (
    <EditModeProvider>
      <AdminAboutEditorInner initialContent={initialContent} />
    </EditModeProvider>
  );
}
