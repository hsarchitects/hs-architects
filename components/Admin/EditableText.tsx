"use client";

import { useState, type ElementType } from "react";
import { useEditMode } from "./EditModeContext";

type EditableTextProps = {
  value: string;
  label: string;
  onSave: (next: string) => Promise<void> | void;
  className?: string;
  /** Use a textarea instead of a single-line input in the edit popover. */
  multiline?: boolean;
  /**
   * When true, `value` is rendered as visible page content (a heading or
   * paragraph), with a small pencil affordance overlaid on hover. When
   * false (default), only the edit control itself renders — for text that
   * isn't visible on the page, e.g. an image's alt text.
   */
  showValue?: boolean;
  /** Tag to render `value` in when showValue is true. Defaults to "p". */
  as?: ElementType;
};

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13.5 3.5 16.5 6.5 6.5 16.5H3.5V13.5Z" />
    </svg>
  );
}

/**
 * A small, self-contained "edit this text" affordance. Renders nothing when
 * not inside an EditModeProvider — the public site never sees it.
 */
export function EditableText({
  value,
  label,
  onSave,
  className,
  multiline = false,
  showValue = false,
  as: Tag = "p",
}: EditableTextProps) {
  const { isEditMode, showToast } = useEditMode();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isEditMode) {
    return showValue ? <Tag className={className}>{value}</Tag> : null;
  }

  function openPopover() {
    setDraft(value);
    setError(null);
    setIsOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(draft.trim());
      setIsOpen(false);
      showToast("Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save. Try again.");
      showToast("Save failed", "error");
    } finally {
      setIsSaving(false);
    }
  }

  const Wrapper = showValue ? "div" : "span";

  return (
    <Wrapper
      className={`group relative ${showValue ? "block w-full" : "inline-flex"}`}
    >
      {showValue && <Tag className={className}>{value}</Tag>}

      <button
        type="button"
        onClick={openPopover}
        aria-label={`Edit ${label}`}
        title={`Edit ${label}`}
        className={
          showValue
            ? "absolute -right-2 -top-2 flex items-center gap-1 rounded-sm border border-stone-300 bg-white p-1 text-stone-500 opacity-0 shadow-sm transition-opacity hover:border-stone-500 hover:text-stone-800 group-hover:opacity-100"
            : "flex items-center gap-1 rounded-sm border border-stone-300 bg-white px-1.5 py-1 text-stone-500 transition-colors hover:border-stone-500 hover:text-stone-800"
        }
      >
        <PencilIcon />
      </button>

      {isOpen && (
        // Capped to the text's own column where there is one: a narrow,
        // clipping column (the project page's sidebars) would otherwise cut
        // off the Save button. The bare-button form has no column to fit.
        <div
          className={`absolute left-0 top-full z-50 mt-2 w-72 border border-stone-200 bg-white p-3 text-left shadow-lg ${
            showValue ? "max-w-full" : ""
          }`}
        >
          <label className="mb-1 block text-xs text-stone-500">{label}</label>
          {multiline ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="mb-2 w-full resize-y border border-stone-300 px-2 py-1.5 text-sm text-stone-900 outline-none focus:border-stone-500"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mb-2 w-full border border-stone-300 px-2 py-1.5 text-sm text-stone-900 outline-none focus:border-stone-500"
              autoFocus
            />
          )}
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-stone-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-stone-700 disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </Wrapper>
  );
}
