"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image, { type ImageLoaderProps } from "next/image";
import { useEditMode } from "./EditModeContext";

type SaveArgs = { src: string; alt: string; categoryId?: string };

type CategoryOption = { id: string; label: string };

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

/**
 * Uploaded images are stored at full resolution. This asks Cloudinary for a
 * copy no wider than the slot it's shown in, in the best format the browser
 * accepts — the same picture at a fraction of the download.
 */
function cloudinaryLoader({ src, width, quality }: ImageLoaderProps) {
  return src.replace(
    "/image/upload/",
    `/image/upload/f_auto,q_${quality ?? "auto"},c_limit,w_${width}/`
  );
}

type EditableImageProps = {
  src: string;
  alt: string;
  onSave: (next: SaveArgs) => Promise<void> | void;
  altLabel?: string;
  sizes?: string;
  imageClassName?: string;
  wrapperClassName?: string;
  /**
   * When given, the modal also offers a "Project type" picker and the save
   * carries the chosen `categoryId` (undefined for "Unselected").
   */
  categoryOptions?: CategoryOption[];
  categoryId?: string;
} & (
  | { fill: true; width?: undefined; height?: undefined; priority?: boolean }
  | { fill?: false; width: number; height: number; priority?: boolean }
);

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 3.5 20.5 8 8 20.5H3.5V16Z" />
    </svg>
  );
}

function BrokenImageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-stone-200 text-xs text-stone-500">
      Image unavailable
    </div>
  );
}

export function EditableImage({
  src,
  alt,
  onSave,
  altLabel = "Alt text",
  sizes,
  imageClassName,
  wrapperClassName,
  categoryOptions,
  categoryId,
  fill,
  width,
  height,
  priority,
}: EditableImageProps) {
  const { isEditMode, showToast } = useEditMode();
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pasted URLs can point anywhere, so skip Next's image optimizer for them
  // rather than requiring every possible host to be allowlisted up front.
  const isExternal = /^https?:\/\//.test(src);
  const isCloudinary =
    isExternal && src.includes("res.cloudinary.com/") && src.includes("/image/upload/");
  const loader = isCloudinary ? cloudinaryLoader : undefined;
  const unoptimized = isExternal && !isCloudinary;

  const image = hasError ? (
    <BrokenImageFallback />
  ) : fill ? (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={priority ? "eager" : undefined}
      loader={loader}
      unoptimized={unoptimized}
      className={imageClassName}
      onError={() => setHasError(true)}
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : undefined}
      loader={loader}
      unoptimized={unoptimized}
      className={imageClassName}
      onError={() => setHasError(true)}
    />
  );

  // If the caller already supplies a position utility (e.g. "absolute
  // inset-0" for a crossfade stack), don't also add "relative" — Tailwind's
  // cascade order means the two can silently conflict and "relative" wins,
  // collapsing an absolutely-positioned wrapper to zero size.
  const hasExplicitPosition = /\b(absolute|fixed|sticky)\b/.test(
    wrapperClassName ?? ""
  );

  return (
    <div
      className={`group ${hasExplicitPosition ? "" : "relative"} ${fill ? "" : "inline-block"} ${wrapperClassName ?? ""}`}
    >
      {image}

      {isEditMode && (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label={`Replace image: ${alt}`}
          className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100 focus-visible:bg-black/40 focus-visible:opacity-100"
        >
          <PencilIcon />
        </button>
      )}

      {isEditMode && isModalOpen && (
        <EditImageModal
          currentSrc={src}
          currentAlt={alt}
          altLabel={altLabel}
          categoryOptions={categoryOptions}
          currentCategoryId={categoryId}
          onClose={() => setIsModalOpen(false)}
          onSave={async (next) => {
            try {
              await onSave(next);
              setHasError(false);
              setIsModalOpen(false);
              showToast("Saved");
            } catch (err) {
              showToast("Save failed", "error");
              // Rethrown so the modal stays open and shows the reason.
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}

function EditImageModal({
  currentSrc,
  currentAlt,
  altLabel,
  categoryOptions,
  currentCategoryId,
  onClose,
  onSave,
}: {
  currentSrc: string;
  currentAlt: string;
  altLabel: string;
  categoryOptions?: CategoryOption[];
  currentCategoryId?: string;
  onClose: () => void;
  onSave: (next: SaveArgs) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [altInput, setAltInput] = useState(currentAlt);
  // A type that has since been deleted falls back to "Unselected".
  const [categoryInput, setCategoryInput] = useState(
    categoryOptions?.find((option) => option.id === currentCategoryId)?.id ?? ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewSrc = file ? URL.createObjectURL(file) : urlInput.trim() || currentSrc;

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      let nextSrc = currentSrc;

      if (file) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error("Unsupported file type. Use JPEG, PNG, WebP, or GIF.");
        }
        if (file.size > MAX_FILE_SIZE) {
          throw new Error("File is too large (max 8MB)");
        }

        // The server signs the upload; the file goes straight to Cloudinary.
        const signResponse = await fetch("/api/upload", { method: "POST" });
        const signed = await signResponse.json().catch(() => null);
        if (!signResponse.ok || !signed) {
          throw new Error(signed?.error ?? "Upload failed");
        }

        const formData = new FormData();
        for (const [key, value] of Object.entries(signed.fields)) {
          formData.append(key, String(value));
        }
        formData.append("file", file);
        const response = await fetch(signed.uploadUrl, {
          method: "POST",
          body: formData,
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.secure_url) {
          throw new Error(data?.error?.message ?? "Upload failed");
        }
        nextSrc = data.secure_url;
      } else if (urlInput.trim()) {
        // Anything else can't be rendered as an image source.
        if (!/^(https?:\/\/|\/)/.test(urlInput.trim())) {
          throw new Error("Enter a full image URL, starting with https://");
        }
        nextSrc = urlInput.trim();
      }

      await onSave({
        src: nextSrc,
        alt: altInput.trim(),
        ...(categoryOptions && { categoryId: categoryInput || undefined }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // Portaled to <body>: a tile ancestor with a CSS filter/transform (e.g. the
  // project grid's grayscale) would otherwise trap `fixed` inside the tile.
  // React events still bubble through the portal, so stop them reaching a
  // clickable tile underneath.
  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-sm font-medium text-stone-900">
          Replace image
        </h2>

        <div className="relative mb-4 aspect-video w-full overflow-hidden bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary/blob preview src, not worth next/image here */}
          <img
            src={previewSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm text-stone-600">
            Upload a replacement image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setUrlInput("");
            }}
            className="w-full text-sm text-stone-600 file:mr-3 file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm text-stone-600">
            — or paste an image URL
          </label>
          <input
            type="text"
            value={urlInput}
            placeholder="https://…"
            onChange={(e) => {
              setUrlInput(e.target.value);
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="w-full border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500"
          />
        </div>

        {categoryOptions && (
          <div className="mb-4">
            <label className="mb-1.5 block text-sm text-stone-600">
              Project type — where a click on this image goes
            </label>
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500"
            >
              <option value="">Unselected</option>
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-5">
          <label className="mb-1.5 block text-sm text-stone-600">
            {altLabel}
          </label>
          <input
            type="text"
            value={altInput}
            onChange={(e) => setAltInput(e.target.value)}
            className="w-full border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500"
          />
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-stone-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
