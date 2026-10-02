"use client";

import { useEffect, useRef, useState } from "react";
import { EditableImage } from "@/components/Admin/EditableImage";
import { EditableText } from "@/components/Admin/EditableText";
import { useEditMode } from "@/components/Admin/EditModeContext";
import type { StudioContent } from "@/lib/content";

type StudioViewProps = {
  studio: StudioContent;
  onIntroChange?: (id: string, text: string) => Promise<void> | void;
  onPrincipleChange?: (
    id: string,
    next: { heading?: string; text?: string }
  ) => Promise<void> | void;
  onImageChange?: (
    id: string,
    next: { src: string; alt: string }
  ) => Promise<void> | void;
};

type Block =
  | { kind: "intro"; id: string; text: string }
  | { kind: "principle"; id: string; heading: string; text: string };

/** How long each photo is shown before crossfading to the next. */
const SLIDE_INTERVAL_MS = 5000;

/**
 * The pinned photo + scrolling copy on /studio. The copy scrolls normally
 * while the photo stays pinned and crossfades through the studio photos on a
 * timer, in order, looping. Visitors who ask for reduced motion get the first
 * photo, still.
 *
 * The photo pins flush beneath the sticky navbar, and both are opaque, so
 * copy that scrolls up behind the photo stays hidden rather than re-emerging
 * above it.
 */
export function StudioView({
  studio,
  onIntroChange,
  onPrincipleChange,
  onImageChange,
}: StudioViewProps) {
  const blocks: Block[] = [
    ...studio.intro.map((b) => ({ kind: "intro" as const, id: b.id, text: b.text })),
    ...studio.principles.map((p) => ({
      kind: "principle" as const,
      id: p.id,
      heading: p.heading,
      text: p.text,
    })),
  ];

  const { isEditMode } = useEditMode();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  // While editing, the slideshow holds still under the pointer so the admin
  // can click the photo they mean to replace.
  const isPaused = useRef(false);
  const imageCount = studio.images.length;

  useEffect(() => {
    if (imageCount < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      if (!isPaused.current) {
        setActiveImageIndex((index) => (index + 1) % imageCount);
      }
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [imageCount]);

  return (
    <section className="isolate mx-auto max-w-xl px-6 pb-32">
      {/* Pins flush under the navbar — offsets mirror the Header's height. */}
      <div className="sticky top-26 z-20 bg-white sm:top-28">
        <div
          className="relative aspect-4/3 w-full overflow-hidden bg-stone-200"
          onMouseEnter={() => {
            isPaused.current = isEditMode;
          }}
          onMouseLeave={() => {
            isPaused.current = false;
          }}
        >
          {studio.images.map((image, index) => (
            <EditableImage
              key={image.id}
              src={image.src}
              alt={image.alt}
              fill
              sizes="36rem"
              priority
              altLabel="Alt text"
              wrapperClassName={`absolute inset-0 transition-opacity duration-1500 ease-in-out ${
                index === activeImageIndex
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
              imageClassName="object-cover"
              onSave={(next) => onImageChange?.(image.id, next)}
            />
          ))}
        </div>

        {/* Copy dissolves into this as it slides up under the photo. */}
        <div className="pointer-events-none absolute inset-x-0 top-full h-16 bg-linear-to-b from-white to-white/0" />
      </div>

      <div className="relative z-0 mt-20 space-y-12">
        {blocks.map((block) => (
          <div key={block.id}>
            {block.kind === "intro" ? (
              <EditableText
                value={block.text}
                label="Paragraph"
                showValue
                as="p"
                multiline
                className="text-base leading-relaxed text-stone-700"
                onSave={(next) => onIntroChange?.(block.id, next)}
              />
            ) : (
              <div className="text-center">
                <EditableText
                  value={block.heading}
                  label="Principle name"
                  showValue
                  as="h3"
                  className="mb-2 text-lg font-medium text-stone-900"
                  onSave={(next) =>
                    onPrincipleChange?.(block.id, { heading: next })
                  }
                />
                <EditableText
                  value={block.text}
                  label="Principle description"
                  showValue
                  as="p"
                  multiline
                  className="text-sm text-stone-600"
                  onSave={(next) => onPrincipleChange?.(block.id, { text: next })}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
