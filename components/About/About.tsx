"use client";

import type { SiteContent } from "@/lib/content";
import { Header } from "@/components/Landing/Header";
import { AboutView } from "./AboutView";

type AboutProps = {
  content: SiteContent;
  onLogoChange?: (next: { src: string; alt: string }) => Promise<void> | void;
  onParagraphChange?: (
    personId: string,
    paragraphId: string,
    text: string
  ) => Promise<void> | void;
  onPersonFieldChange?: (
    personId: string,
    next: { name?: string; role?: string }
  ) => Promise<void> | void;
  onCardChange?: (
    personId: string,
    cardId: string,
    next: { heading?: string; text?: string }
  ) => Promise<void> | void;
  onPortraitChange?: (
    personId: string,
    next: { src: string; alt: string }
  ) => Promise<void> | void;
  onTogetherChange?: (
    next: { eyebrow?: string; text?: string }
  ) => Promise<void> | void;
  onTogetherLineChange?: (id: string, text: string) => Promise<void> | void;
};

/**
 * The public About Us page shell. Rendered as-is on /about, and wrapped in
 * EditModeProvider on /admin/about — same reuse pattern as Landing/Studio.
 */
export function About({
  content,
  onLogoChange,
  ...handlers
}: AboutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:h-screen lg:overflow-hidden">
      <Header
        logoSrc={content.header.logoSrc}
        logoText={content.header.logoText}
        onLogoChange={onLogoChange}
      />
      <AboutView about={content.about} {...handlers} />
    </div>
  );
}
