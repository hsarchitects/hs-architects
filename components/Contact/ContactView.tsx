"use client";

import { EditableText } from "@/components/Admin/EditableText";
import type { ContactContent, ContactDetail } from "@/lib/content";
import { OfficeMap } from "./OfficeMap";

/**
 * mailto:/tel: link for a contact detail, or null when it's plain text.
 * Lives here rather than in lib/content so this client component doesn't
 * pull that module's `fs` import into the browser bundle.
 */
function contactDetailHref(detail: ContactDetail): string | null {
  if (detail.type === "email") return `mailto:${detail.value.trim()}`;
  if (detail.type === "phone") return `tel:${detail.value.replace(/[^+\d]/g, "")}`;
  return null;
}

type ContactViewProps = {
  contact: ContactContent;
  onIntroChange?: (text: string) => Promise<void> | void;
  onDetailChange?: (
    id: string,
    next: { label?: string; value?: string }
  ) => Promise<void> | void;
};

/**
 * Contact details on the left, a square map of the studio on the right.
 * Deliberately spare: a single line of copy and the ways to reach the studio,
 * no form. Below the two-column breakpoint the map drops beneath the details
 * and the text re-centres, since a lone left-aligned column reads oddly on a
 * narrow screen.
 */
export function ContactView({
  contact,
  onIntroChange,
  onDetailChange,
}: ContactViewProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-6.5rem)] max-w-6xl items-center px-6 py-20 sm:px-10 sm:min-h-[calc(100vh-7rem)]">
      <div className="grid w-full items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="w-full">
          <EditableText
            value={contact.intro}
            label="Intro line"
            showValue
            as="p"
            multiline
            className="text-center text-base leading-relaxed text-stone-700 lg:text-left"
            onSave={(next) => onIntroChange?.(next)}
          />

          <div className="mt-16 space-y-10">
            {contact.details.map((detail) => {
              const href = contactDetailHref(detail);
              return (
                <div key={detail.id} className="text-center lg:text-left">
                  <EditableText
                    value={detail.label}
                    label="Detail label"
                    showValue
                    as="p"
                    className="text-xs uppercase tracking-widest text-stone-400"
                    onSave={(next) =>
                      onDetailChange?.(detail.id, { label: next })
                    }
                  />

                  <div className="mt-2 flex items-start justify-center gap-2 lg:justify-start">
                    {href ? (
                      <a
                        href={href}
                        className="text-lg text-stone-900 transition-colors hover:text-stone-500"
                      >
                        {detail.value}
                      </a>
                    ) : (
                      <p className="whitespace-pre-line text-lg leading-relaxed text-stone-900">
                        {detail.value}
                      </p>
                    )}

                    {/* Value is a link, so the edit control sits beside it. */}
                    <EditableText
                      value={detail.value}
                      label={`${detail.label} value`}
                      multiline={detail.type === "text"}
                      onSave={(next) =>
                        onDetailChange?.(detail.id, { value: next })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <OfficeMap />
      </div>
    </section>
  );
}
