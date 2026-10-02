"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

/** Shown when a page fails to render — e.g. the database can't be reached. */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <p className="text-sm text-stone-700">
        This page couldn&rsquo;t be loaded just now.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="text-sm text-stone-400 transition-colors hover:text-stone-900"
      >
        Try again
      </button>
    </div>
  );
}
