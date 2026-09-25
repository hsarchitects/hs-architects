"use client";

import type { ProjectImageRow, SiteContent } from "@/lib/content";
import { Header } from "./Header";
import { Gallery } from "./Gallery";

type LandingProps = {
  content: SiteContent;
  onLogoChange?: (next: { src: string; alt: string }) => Promise<void> | void;
  onGalleryRowsChange?: (rows: ProjectImageRow[]) => Promise<void> | void;
};

/**
 * The public landing page shell. Rendered as-is on `/`, and wrapped in
 * `EditModeProvider` on `/admin` so the same markup gets click-to-edit
 * affordances without the two views drifting apart. `onLogoChange` /
 * `onGalleryRowsChange` are only ever passed by the admin editor — the public
 * page renders this with neither, so EditableImage/EditableText show no
 * affordances there.
 */
export function Landing({
  content,
  onLogoChange,
  onGalleryRowsChange,
}: LandingProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header
        logoSrc={content.header.logoSrc}
        logoText={content.header.logoText}
        onLogoChange={onLogoChange}
      />
      <Gallery rows={content.gallery.rows} onRowsChange={onGalleryRowsChange} />
    </div>
  );
}
