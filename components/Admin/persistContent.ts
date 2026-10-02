import type { SiteContent } from "@/lib/content";

// The version the server last confirmed to this tab. Every save names the
// version it builds on, and the server refuses one that's out of date.
let savedVersion = 0;

// Saves run one at a time, so a quick second edit builds on the version the
// first one produced rather than racing it.
let queue: Promise<unknown> = Promise.resolve();

export function persistContent(content: SiteContent) {
  const save = queue.then(async () => {
    const version = Math.max(savedVersion, content.version ?? 0);
    const response = await fetch("/api/content/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...content, version }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error ?? "Failed to save changes");
    }
    savedVersion = data.version;
  });
  queue = save.catch(() => {});
  return save;
}
