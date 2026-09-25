import type { SiteContent } from "@/lib/content";

export async function persistContent(content: SiteContent) {
  const response = await fetch("/api/content/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Failed to save changes");
  }
}
