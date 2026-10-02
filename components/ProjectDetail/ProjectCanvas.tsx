"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditableImage } from "@/components/Admin/EditableImage";
import { useEditMode } from "@/components/Admin/EditModeContext";
import type { ProjectImage, ProjectImageRow } from "@/lib/content";

type ProjectCanvasProps = {
  rows: ProjectImageRow[];
  /**
   * Only passed by the admin editor. Receives the whole rows array so the
   * editor can persist one atomic change per interaction.
   */
  onRowsChange?: (rows: ProjectImageRow[]) => Promise<void> | void;
  /** Gap between rows and between images, as a CSS length. */
  gap?: string;
  /** `sizes` for the images — the landing grid is far narrower than a project page. */
  imageSizes?: string;
  /**
   * Whether the admin may add images to a row. Without this, removing one
   * would be a one-way door, so it should only be off where images can't be
   * lost in the first place.
   */
  allowAddImages?: boolean;
  /**
   * Whether whole rows can be added and deleted. The /projects grid keeps a
   * fixed set of rows, so it turns this off — and deleting a row goes with
   * it, since there'd be no way to add one back.
   */
  allowAddRows?: boolean;
  /** Images per row. The /projects grid stays three across. */
  maxItemsPerRow?: number;
  /** Public-page click-to-enlarge, used by the /projects grid. */
  expandable?: boolean;
};

const DEFAULT_MAX_ITEMS_PER_ROW = 4;
/** Keeps a dragged divider from collapsing an image to nothing. */
const MIN_SPAN_FRACTION = 0.12;
const MIN_ASPECT = 0.6;
const MAX_ASPECT = 5;

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** A fresh image starts as a grey placeholder the admin then replaces. */
function blankImage(): ProjectImage {
  return { id: newId("img"), src: "", alt: "", span: 1 };
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute -top-3 right-0 z-50 flex gap-1 opacity-0 transition-opacity group-hover/row:pointer-events-auto group-hover/row:opacity-100">
      {children}
    </div>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="border border-stone-300 bg-white px-2 py-1 text-[0.65rem] font-medium text-stone-600 shadow-sm transition-colors hover:border-stone-500 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * The scrolling image area of a project page.
 *
 * A row is a horizontal strip whose height comes from its `aspect`
 * (width ÷ height); the images inside share that height and split the width
 * in proportion to their `span`. That keeps the layout responsive — on small
 * screens `.project-row` (see globals.css) drops to a stack and each image
 * falls back to a fixed aspect, so a three-up row doesn't become three
 * slivers on a phone.
 *
 * Rendered read-only on the public page; the admin passes `onRowsChange` and
 * the same markup grows drag handles and row controls.
 */
export function ProjectCanvas({
  rows,
  onRowsChange,
  gap = "0.375rem",
  imageSizes = "(min-width: 1024px) 60vw, 100vw",
  allowAddImages = true,
  allowAddRows = true,
  maxItemsPerRow = DEFAULT_MAX_ITEMS_PER_ROW,
  expandable = false,
}: ProjectCanvasProps) {
  const { isEditMode, showToast } = useEditMode();
  const isEditable = isEditMode && !!onRowsChange;
  // Enlarging and editing would fight over the same click, so the public
  // page expands and the admin edits.
  const canExpand = expandable && !isEditable;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!expandedId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedId]);

  // Collapse if the enlarged tile is deleted out from under us.
  const expandedStillExists = rows.some((row) =>
    row.items.some((item) => item.id === expandedId)
  );
  if (expandedId && !expandedStillExists) setExpandedId(null);

  /**
   * Every canvas change funnels through here. The editor reverts its own
   * state and rethrows when a save fails, so catching it is what turns a
   * dropped request into a toast instead of an unhandled rejection — the
   * same treatment EditableText and EditableImage already give their saves.
   * `rethrow` is for a caller that reports the outcome itself: the image
   * modal has to see the failure, or it closes and announces "Saved".
   */
  const commit = useCallback(
    async (next: ProjectImageRow[], rethrow = false) => {
      if (!onRowsChange) return;
      try {
        await onRowsChange(next);
        showToast("Saved");
      } catch (err) {
        if (rethrow) throw err;
        showToast(
          err instanceof Error ? err.message : "Couldn't save — check your connection",
          "error"
        );
      }
    },
    [onRowsChange, showToast]
  );

  const replaceRow = useCallback(
    (
      rowId: string,
      change: (row: ProjectImageRow) => ProjectImageRow,
      rethrow = false
    ) =>
      commit(
        rows.map((row) => (row.id === rowId ? change(row) : row)),
        rethrow
      ),
    [commit, rows]
  );

  const handleImageSave = useCallback(
    (rowId: string, imageId: string, next: { src: string; alt: string }) =>
      replaceRow(
        rowId,
        (row) => ({
          ...row,
          items: row.items.map((item) =>
            item.id === imageId ? { ...item, ...next } : item
          ),
        }),
        true
      ),
    [replaceRow]
  );

  return (
    <div
      className="flex flex-col"
      style={{ "--row-gap": gap, gap } as React.CSSProperties}
    >
      {rows.map((row, rowIndex) => (
        <CanvasRow
          key={row.id}
          row={row}
          isEditable={isEditable}
          allowAddImages={allowAddImages}
          allowAddRows={allowAddRows}
          maxItemsPerRow={maxItemsPerRow}
          imageSizes={imageSizes}
          rowIndex={rowIndex}
          rowCount={rows.length}
          canExpand={canExpand}
          expandedId={expandedId}
          onToggleExpand={(id) =>
            setExpandedId((current) => (current === id ? null : id))
          }
          isAnyExpanded={!!expandedId}
          isFirst={rowIndex === 0}
          isLast={rowIndex === rows.length - 1}
          onImageSave={(imageId, next) => handleImageSave(row.id, imageId, next)}
          onSpansChange={(spans) =>
            replaceRow(row.id, (current) => ({
              ...current,
              items: current.items.map((item, index) => ({
                ...item,
                span: spans[index] ?? item.span,
              })),
            }))
          }
          onAspectChange={(aspect) =>
            replaceRow(row.id, (current) => ({ ...current, aspect }))
          }
          onAddImage={() =>
            replaceRow(row.id, (current) => ({
              ...current,
              items: [...current.items, blankImage()],
            }))
          }
          onDeleteImage={(imageId) =>
            replaceRow(row.id, (current) => ({
              ...current,
              items: current.items.filter((item) => item.id !== imageId),
            }))
          }
          onMove={(direction) => {
            const target = rowIndex + direction;
            if (target < 0 || target >= rows.length) return;
            const next = [...rows];
            [next[rowIndex], next[target]] = [next[target], next[rowIndex]];
            commit(next);
          }}
          onDeleteRow={() => commit(rows.filter((r) => r.id !== row.id))}
        />
      ))}

      {isEditable && allowAddRows && (
        <button
          type="button"
          onClick={() =>
            commit([
              ...rows,
              { id: newId("row"), aspect: 1.78, items: [blankImage()] },
            ])
          }
          className="mt-2 border border-dashed border-stone-300 py-4 text-xs font-medium text-stone-500 transition-colors hover:border-stone-500 hover:text-stone-800"
        >
          + Add image row
        </button>
      )}
    </div>
  );
}

function CanvasRow({
  row,
  isEditable,
  allowAddImages,
  allowAddRows,
  maxItemsPerRow,
  imageSizes,
  rowIndex,
  rowCount,
  canExpand,
  expandedId,
  onToggleExpand,
  isAnyExpanded,
  isFirst,
  isLast,
  onImageSave,
  onSpansChange,
  onAspectChange,
  onAddImage,
  onDeleteImage,
  onMove,
  onDeleteRow,
}: {
  row: ProjectImageRow;
  isEditable: boolean;
  allowAddImages: boolean;
  allowAddRows: boolean;
  maxItemsPerRow: number;
  imageSizes: string;
  rowIndex: number;
  rowCount: number;
  canExpand: boolean;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  isAnyExpanded: boolean;
  isFirst: boolean;
  isLast: boolean;
  onImageSave: (
    imageId: string,
    next: { src: string; alt: string }
  ) => Promise<void> | void;
  onSpansChange: (spans: number[]) => void;
  onAspectChange: (aspect: number) => void;
  onAddImage: () => void;
  onDeleteImage: (imageId: string) => void;
  onMove: (direction: -1 | 1) => void;
  onDeleteRow: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  // While dragging we hold the provisional values locally and only persist on
  // release, so a drag is one save rather than one per pointer move.
  const [draftSpans, setDraftSpans] = useState<number[] | null>(null);
  const [draftAspect, setDraftAspect] = useState<number | null>(null);

  const spans = draftSpans ?? row.items.map((item) => item.span);
  const aspect = draftAspect ?? row.aspect;
  const total = spans.reduce((sum, span) => sum + span, 0) || 1;

  /** Drags the boundary between items `index` and `index + 1`. */
  function startSpanDrag(event: React.PointerEvent, index: number) {
    event.preventDefault();
    const rowEl = rowRef.current;
    if (!rowEl) return;

    const rowWidth = rowEl.getBoundingClientRect().width;
    const startX = event.clientX;
    const startSpans = [...spans];
    // The pair shares a fixed slice of the row, so resizing one only ever
    // takes from its neighbour and the other items stay put.
    const pairTotal = startSpans[index] + startSpans[index + 1];
    const pairWidth = (pairTotal / total) * rowWidth;
    let latest = startSpans;

    function onMove(moveEvent: PointerEvent) {
      const deltaFraction = (moveEvent.clientX - startX) / (pairWidth || 1);
      const leftShare = Math.min(
        1 - MIN_SPAN_FRACTION,
        Math.max(
          MIN_SPAN_FRACTION,
          startSpans[index] / pairTotal + deltaFraction
        )
      );
      latest = [...startSpans];
      latest[index] = pairTotal * leftShare;
      latest[index + 1] = pairTotal * (1 - leftShare);
      setDraftSpans(latest);
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDraftSpans(null);
      onSpansChange(latest);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /** Drags the row's bottom edge, changing its height via the aspect ratio. */
  function startAspectDrag(event: React.PointerEvent) {
    event.preventDefault();
    const rowEl = rowRef.current;
    if (!rowEl) return;

    const rect = rowEl.getBoundingClientRect();
    const startY = event.clientY;
    const startHeight = rect.height;
    let latest = aspect;

    function onMove(moveEvent: PointerEvent) {
      const height = Math.max(80, startHeight + (moveEvent.clientY - startY));
      latest = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, rect.width / height));
      setDraftAspect(latest);
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDraftAspect(null);
      onAspectChange(latest);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div className="group/row relative">
      {isEditable && (
        <Toolbar>
          {allowAddImages && (
            <ToolbarButton
              onClick={onAddImage}
              disabled={row.items.length >= maxItemsPerRow}
              title="Add an image to this row"
            >
              + Image
            </ToolbarButton>
          )}
          <ToolbarButton
            onClick={() => onMove(-1)}
            disabled={isFirst}
            title="Move row up"
          >
            ↑
          </ToolbarButton>
          <ToolbarButton
            onClick={() => onMove(1)}
            disabled={isLast}
            title="Move row down"
          >
            ↓
          </ToolbarButton>
          {allowAddRows && (
            <ToolbarButton onClick={onDeleteRow} title="Delete this row">
              Delete row
            </ToolbarButton>
          )}
        </Toolbar>
      )}

      <div
        ref={rowRef}
        className="project-row"
        style={{ "--row-aspect": aspect } as React.CSSProperties}
      >
        {row.items.map((item, index) => (
          // The clip is on the inner wrapper, not the item itself, so the
          // divider handle can overhang the item's edge without being cut off.
          <div
            key={item.id}
            className="relative min-w-0"
            style={{ "--span": spans[index] } as React.CSSProperties}
          >
            <TileFrame
              isExpanded={expandedId === item.id}
              isDimmed={isAnyExpanded && expandedId !== item.id}
              canExpand={canExpand}
              indexInRow={index}
              itemsInRow={row.items.length}
              rowIndex={rowIndex}
              rowCount={rowCount}
              alt={item.alt}
              onToggle={() => onToggleExpand(item.id)}
            >
              {item.src ? (
                <EditableImage
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes={imageSizes}
                  altLabel="Alt text"
                  wrapperClassName="absolute inset-0"
                  imageClassName="object-cover"
                  onSave={(next) => onImageSave(item.id, next)}
                />
              ) : isEditable ? (
                // A placeholder slot: EditableImage needs a real src, so this
                // stands in until one is chosen.
                <EmptySlot onSave={(next) => onImageSave(item.id, next)} />
              ) : null}
            </TileFrame>

            {isEditable && row.items.length > 1 && (
              <button
                type="button"
                onClick={() => onDeleteImage(item.id)}
                title="Remove this image"
                aria-label="Remove this image"
                className="absolute right-1.5 top-1.5 z-30 border border-stone-300 bg-white px-1.5 py-0.5 text-[0.65rem] text-stone-600 opacity-0 shadow-sm transition-opacity hover:text-stone-900 group-hover/row:opacity-100"
              >
                ✕
              </button>
            )}

            {/* Divider handle, sitting over the gap to the next image. */}
            {isEditable && index < row.items.length - 1 && (
              <div
                onPointerDown={(event) => startSpanDrag(event, index)}
                role="separator"
                aria-orientation="vertical"
                className="absolute -right-2 top-0 z-40 hidden h-full w-4 cursor-col-resize touch-none items-center justify-center sm:flex"
              >
                <span className="h-10 w-1 rounded-full bg-white/0 shadow transition-colors group-hover/row:bg-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditable && (
        <div
          onPointerDown={startAspectDrag}
          role="separator"
          aria-orientation="horizontal"
          title="Drag to change row height"
          className="absolute -bottom-2 left-1/2 z-40 hidden h-4 w-24 -translate-x-1/2 cursor-row-resize touch-none items-center justify-center sm:flex"
        >
          <span className="h-1 w-10 rounded-full bg-white/0 shadow transition-colors group-hover/row:bg-white" />
        </div>
      )}
    </div>
  );
}

/**
 * The clipped frame around one image. Normally it just fills its slot; when
 * the tile is enlarged it grows to roughly twice its own width and height and
 * shifts back toward the middle of the grid, so an edge tile expands inward
 * instead of spilling outside it. Offsets are in percentages of the tile's own
 * box, which keeps this working whatever widths the admin has dragged.
 */
function TileFrame({
  isExpanded,
  isDimmed,
  canExpand,
  indexInRow,
  itemsInRow,
  rowIndex,
  rowCount,
  alt,
  onToggle,
  children,
}: {
  isExpanded: boolean;
  isDimmed: boolean;
  canExpand: boolean;
  indexInRow: number;
  itemsInRow: number;
  rowIndex: number;
  rowCount: number;
  alt: string;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const gap = "var(--row-gap, 0.375rem)";

  /** Pulls the enlarged tile back from whichever edge it would overflow. */
  function offset(index: number, count: number) {
    if (count < 2) return "0%";
    if (index === 0) return "0%";
    if (index === count - 1) return `calc(-100% - ${gap})`;
    return `calc(-50% - (${gap} / 2))`;
  }

  const style: React.CSSProperties = isExpanded
    ? {
        left: offset(indexInRow, itemsInRow),
        top: offset(rowIndex, rowCount),
        width: `calc(200% + ${gap})`,
        height: `calc(200% + ${gap})`,
      }
    : { left: 0, top: 0, width: "100%", height: "100%" };

  const className = `absolute overflow-hidden bg-stone-200 ${
    canExpand
      ? "transition-[left,top,width,height,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      : ""
  } ${isDimmed ? "grayscale" : "grayscale-0"} ${isExpanded ? "z-20" : "z-0"}`;

  if (!canExpand) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-expanded={isExpanded}
      aria-label={isExpanded ? `Shrink ${alt}` : `Enlarge ${alt}`}
      onClick={onToggle}
      className={`${className} cursor-pointer`}
      style={style}
    >
      {children}
    </button>
  );
}

/** Empty image slot shown in the admin until a file or URL is chosen. */
function EmptySlot({
  onSave,
}: {
  onSave: (next: { src: string; alt: string }) => Promise<void> | void;
}) {
  return (
    <div className="absolute inset-0">
      <EditableImage
        src="/uploads/logo.png"
        alt=""
        fill
        sizes="20vw"
        altLabel="Alt text"
        wrapperClassName="absolute inset-0 opacity-25"
        imageClassName="object-contain p-6"
        onSave={onSave}
      />
      <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[0.65rem] tracking-wide text-stone-500">
        Empty slot — click to add an image
      </p>
    </div>
  );
}
