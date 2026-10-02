import type { Metadata } from "next";
import "./globals.css";
import { PageTransition } from "@/components/PageTransition";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "HS Architects", template: "%s — HS Architects" },
  description: "Portfolio of HS Architects.",
  openGraph: { siteName: "HS Architects", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
