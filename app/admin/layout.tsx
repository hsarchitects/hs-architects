import type { Metadata } from "next";

// Keeps the editor and its sign-in page out of search results.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
