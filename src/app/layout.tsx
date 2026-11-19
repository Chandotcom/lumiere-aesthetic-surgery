import type { Metadata } from "next";
import { Geist_Mono, Inter, Jost } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { DemoBanner } from "@/components/site/demo-banner";
import { allowIndexing, site } from "@/lib/site";
import "./globals.css";

const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });
// Headings: geometric sans, used light at large sizes. Variable font (all weights).
const display = Jost({ variable: "--font-display", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website", locale: "en_US" },
  // Demo is noindex by default — see NEXT_PUBLIC_ALLOW_INDEXING.
  robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DemoBanner />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
