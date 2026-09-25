"use client";

import { useState } from "react";
import Link from "next/link";
import { EditableImage } from "@/components/Admin/EditableImage";
import { EditableText } from "@/components/Admin/EditableText";
import { useEditMode } from "@/components/Admin/EditModeContext";

type HeaderProps = {
  logoSrc: string;
  logoText: string;
  onLogoChange?: (next: { src: string; alt: string }) => Promise<void> | void;
};

// `editHref` is where the item goes while editing, so the same menu navigates
// between the editable versions of the pages. Items without a real page yet
// are placeholders — wire them up once those sections exist.
const NAV_ITEMS: { label: string; href: string; editHref?: string }[] = [
  { label: "Studio", href: "/studio", editHref: "/admin/studio" },
  { label: "About Us", href: "/about", editHref: "/admin/about" },
  { label: "Projects", href: "/projects", editHref: "/admin/projects" },
  { label: "Contact Us", href: "/contact", editHref: "/admin/contact" },
];

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span className="relative block h-4 w-6">
      <span
        className={`absolute left-0 h-0.5 w-6 bg-stone-900 transition-all duration-300 ease-in-out ${
          isOpen ? "top-1.75 rotate-45" : "top-0 rotate-0"
        }`}
      />
      <span
        className={`absolute left-0 top-1.75 h-0.5 w-6 bg-stone-900 transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 h-0.5 w-6 bg-stone-900 transition-all duration-300 ease-in-out ${
          isOpen ? "top-1.75 -rotate-45" : "top-3.5 rotate-0"
        }`}
      />
    </span>
  );
}

export function Header({ logoSrc, logoText, onLogoChange }: HeaderProps) {
  const { isEditMode } = useEditMode();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // The bar's height is fixed (and mirrored by the sticky offset on /studio)
  // so the pinned photo there can sit flush against it with no gap.
  return (
    <header
      className="sticky top-0 z-50 h-26 bg-white sm:h-28"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="flex h-full w-full items-center justify-between px-6 sm:px-10">
        <div className="relative z-40 flex items-center gap-2">
          {/* While editing, the logo opens its own image editor instead. */}
          {!isEditMode && (
            <Link
              href="/"
              aria-label="HS Architects — home"
              className="absolute inset-0 z-10"
            />
          )}
          <EditableImage
            src={logoSrc}
            alt={logoText}
            width={155}
            height={50}
            priority
            imageClassName="h-14 w-auto sm:h-16"
            altLabel="Logo image"
            onSave={(next) =>
              onLogoChange?.({ src: next.src, alt: logoText })
            }
          />
          {onLogoChange && (
            <EditableText
              value={logoText}
              label="Logo name (alt text)"
              onSave={(next) => onLogoChange({ src: logoSrc, alt: next })}
            />
          )}
        </div>

        <button
          type="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="relative z-50 rounded-sm p-1.5 transition-colors hover:bg-stone-100"
        >
          <HamburgerIcon isOpen={isMenuOpen} />
        </button>
      </div>

      {/* Always mounted so both the open and close transitions can play. */}
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={() => setIsMenuOpen(false)}
        className={`fixed inset-0 z-30 cursor-default transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <nav
        aria-label="Primary"
        aria-hidden={!isMenuOpen}
        className={`absolute right-6 top-full z-40 flex flex-col items-end gap-4 bg-white px-7 py-6 transition-opacity duration-300 sm:right-10 ${
          isMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {NAV_ITEMS.map((item, index) => (
          <Link
            key={item.label}
            href={isEditMode && item.editHref ? item.editHref : item.href}
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={() => setIsMenuOpen(false)}
            style={{ transitionDelay: isMenuOpen ? `${index * 60}ms` : "0ms" }}
            className={`text-lg font-bold text-stone-900 transition-all duration-300 ease-out hover:text-stone-500 ${
              isMenuOpen
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
