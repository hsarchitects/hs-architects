"use client";

import type { SiteContent } from "@/lib/content";
import { Header } from "@/components/Landing/Header";
import { StudioView } from "./StudioView";

type StudioProps = {
  content: SiteContent;
  onLogoChange?: (next: { src: string; alt: string }) => Promise<void> | void;
  onIntroChange?: (id: string, text: string) => Promise<void> | void;
  onPrincipleChange?: (
    id: string,
    next: { heading?: string; text?: string }
  ) => Promise<void> | void;
  onStudioImageChange?: (
    id: string,
    next: { src: string; alt: string }
  ) => Promise<void> | void;
};

/**
 * The public Studio page shell. Rendered as-is on /studio, and wrapped in
 * EditModeProvider on /admin/studio — same reuse pattern as Landing.
 */
export function Studio({
  content,
  onLogoChange,
  onIntroChange,
  onPrincipleChange,
  onStudioImageChange,
}: StudioProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header
        logoSrc={content.header.logoSrc}
        logoText={content.header.logoText}
        onLogoChange={onLogoChange}
      />
      <StudioView
        studio={content.studio}
        onIntroChange={onIntroChange}
        onPrincipleChange={onPrincipleChange}
        onImageChange={onStudioImageChange}
      />
    </div>
  );
}
