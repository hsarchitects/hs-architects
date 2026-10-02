"use client";

import { useCallback, useRef, useState } from "react";
import type { SiteContent } from "@/lib/content";
import { persistContent } from "./persistContent";

/**
 * The content state every admin editor shares: apply a change optimistically,
 * save the whole tree, and roll back if the save fails.
 *
 * The newest content is also held in a ref, so each change builds on what the
 * previous one produced rather than on the copy captured at render time —
 * otherwise two edits made from the same render would have the second save
 * quietly drop the first.
 */
export function useContentEditor(initialContent: SiteContent) {
  const [content, setContent] = useState(initialContent);
  const latest = useRef(initialContent);

  const updateAndPersist = useCallback(
    async (updater: (prev: SiteContent) => SiteContent) => {
      const previous = latest.current;
      const updated = updater(previous);
      latest.current = updated;
      setContent(updated);
      try {
        await persistContent(updated);
      } catch (err) {
        // Only roll back if no later edit has been applied on top of this one.
        if (latest.current === updated) {
          latest.current = previous;
          setContent(previous);
        }
        throw err;
      }
    },
    []
  );

  return [content, updateAndPersist] as const;
}
