"use client";

import type { SiteContent } from "@/lib/content";
import { Header } from "@/components/Landing/Header";
import { ContactView } from "./ContactView";

type ContactProps = {
  content: SiteContent;
  onLogoChange?: (next: { src: string; alt: string }) => Promise<void> | void;
  onIntroChange?: (text: string) => Promise<void> | void;
  onDetailChange?: (
    id: string,
    next: { label?: string; value?: string }
  ) => Promise<void> | void;
};

/**
 * The public Contact page shell. Rendered as-is on /contact, and wrapped in
 * EditModeProvider on /admin/contact — same reuse pattern as Landing/Studio.
 */
export function Contact({
  content,
  onLogoChange,
  onIntroChange,
  onDetailChange,
}: ContactProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header
        logoSrc={content.header.logoSrc}
        logoText={content.header.logoText}
        onLogoChange={onLogoChange}
      />
      <ContactView
        contact={content.contact}
        onIntroChange={onIntroChange}
        onDetailChange={onDetailChange}
      />
    </div>
  );
}
