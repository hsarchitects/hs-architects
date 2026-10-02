"use client";

import { EditableImage } from "@/components/Admin/EditableImage";
import { EditableText } from "@/components/Admin/EditableText";
import type { AboutContent, AboutPerson } from "@/lib/content";

type AboutViewProps = {
  about: AboutContent;
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

/** The three tile glyphs, in the order the cards are listed. */
function CardIcon({ index }: { index: number }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-7 w-7 text-stone-400",
    "aria-hidden": true,
  };

  if (index === 0) {
    return (
      <svg {...common}>
        <path d="M12 2.5 21 7v10l-9 4.5L3 17V7Z" />
        <path d="M3 7l9 4.5L21 7M12 11.5V21.5" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
        <path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M17.5 14.6a5.5 5.5 0 0 1 3 4.9" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M20 4c0 9-5.5 13.5-11 13.5H5.5C5.5 9 12 4 20 4Z" />
      <path d="M4 20c1.5-3.5 4-6.5 7.5-8.5" />
    </svg>
  );
}

function Person({
  person,
  onParagraphChange,
  onPersonFieldChange,
  onCardChange,
  onPortraitChange,
}: {
  person: AboutPerson;
} & Pick<
  AboutViewProps,
  | "onParagraphChange"
  | "onPersonFieldChange"
  | "onCardChange"
  | "onPortraitChange"
>) {
  return (
    <div className="flex min-h-0 flex-col gap-8 lg:flex-row lg:gap-10">
      <div className="flex min-w-0 flex-1 flex-col justify-start">
        <EditableText
          value={person.name}
          label="Name"
          showValue
          as="h2"
          className="text-3xl font-light tracking-tight text-stone-900 sm:text-4xl"
          onSave={(next) => onPersonFieldChange?.(person.id, { name: next })}
        />
        <EditableText
          value={person.role}
          label="Role"
          showValue
          as="p"
          className="mt-5 text-sm font-bold text-stone-900"
          onSave={(next) => onPersonFieldChange?.(person.id, { role: next })}
        />
        <div className="mt-6 space-y-5">
          {person.paragraphs.map((paragraph) => (
            <EditableText
              key={paragraph.id}
              value={paragraph.text}
              label="Paragraph"
              showValue
              as="p"
              multiline
              className="text-sm leading-relaxed text-stone-700"
              onSave={(next) =>
                onParagraphChange?.(person.id, paragraph.id, next)
              }
            />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-col gap-2 lg:w-1/2">
        <div className="relative min-h-40 flex-1 overflow-hidden bg-stone-200">
          <EditableImage
            src={person.image.src}
            alt={person.image.alt}
            fill
            sizes="(min-width: 1024px) 24rem, 100vw"
            priority
            altLabel="Alt text"
            wrapperClassName="absolute inset-0"
            imageClassName="object-cover"
            onSave={(next) => onPortraitChange?.(person.id, next)}
          />
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-2">
          {person.cards.map((card, index) => (
            <div
              key={card.id}
              className="flex flex-col items-center bg-stone-100 px-2 py-4 text-center"
            >
              <CardIcon index={index} />
              <EditableText
                value={card.heading}
                label="Card title"
                showValue
                as="p"
                className="mt-3 text-[0.65rem] tracking-wide text-stone-600"
                onSave={(next) =>
                  onCardChange?.(person.id, card.id, { heading: next })
                }
              />
              <EditableText
                value={card.text}
                label="Card description"
                showValue
                as="p"
                multiline
                className="mt-2 text-[0.6rem] leading-snug text-stone-500"
                onSave={(next) =>
                  onCardChange?.(person.id, card.id, { text: next })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The two founder profiles side by side with the shared "Together" note
 * beneath. On large screens the whole page is sized to the viewport so it
 * never scrolls; below that it stacks and flows normally.
 */
export function AboutView({
  about,
  onParagraphChange,
  onPersonFieldChange,
  onCardChange,
  onPortraitChange,
  onTogetherChange,
  onTogetherLineChange,
}: AboutViewProps) {
  return (
    <section className="mx-auto flex w-full max-w-[100rem] flex-col gap-10 px-6 pb-12 sm:px-10 lg:h-[calc(100svh-7rem)] lg:gap-6 lg:overflow-hidden lg:pb-6">
      <div className="grid min-h-0 gap-12 lg:flex-1 lg:grid-cols-2 lg:gap-14">
        {about.people.map((person) => (
          <Person
            key={person.id}
            person={person}
            onParagraphChange={onParagraphChange}
            onPersonFieldChange={onPersonFieldChange}
            onCardChange={onCardChange}
            onPortraitChange={onPortraitChange}
          />
        ))}
      </div>

      <div className="shrink-0 text-center">
        <EditableText
          value={about.together.eyebrow}
          label="Section label"
          showValue
          as="p"
          className="text-xs tracking-[0.2em] text-stone-600"
          onSave={(next) => onTogetherChange?.({ eyebrow: next })}
        />
        <div className="mt-4 space-y-1">
          {about.together.lines.map((line) => (
            <EditableText
              key={line.id}
              value={line.text}
              label="Line"
              showValue
              as="p"
              className="text-sm text-stone-700"
              onSave={(next) => onTogetherLineChange?.(line.id, next)}
            />
          ))}
        </div>
        <EditableText
          value={about.together.text}
          label="Closing paragraph"
          showValue
          as="p"
          multiline
          className="mx-auto mt-5 max-w-none text-sm leading-relaxed text-stone-700"
          onSave={(next) => onTogetherChange?.({ text: next })}
        />
      </div>
    </section>
  );
}
