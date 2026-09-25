"use client";

import { ProjectCanvas } from "@/components/ProjectDetail/ProjectCanvas";
import type { ProjectImageRow } from "@/lib/content";

type GalleryProps = {
  rows: ProjectImageRow[];
  onRowsChange?: (rows: ProjectImageRow[]) => Promise<void> | void;
};

/**
 * The landing grid. It's the same canvas a project page uses, at a smaller
 * scale and a tighter gap — so the admin gets one set of controls to learn,
 * and the two stay in step as the canvas gains features.
 */
export function Gallery({ rows, onRowsChange }: GalleryProps) {
  return (
    <section className="mx-auto max-w-xl px-6 py-20 sm:py-28">
      <ProjectCanvas
        rows={rows}
        onRowsChange={onRowsChange}
        gap="0.25rem"
        imageSizes="(min-width: 640px) 12rem, 50vw"
      />
    </section>
  );
}
