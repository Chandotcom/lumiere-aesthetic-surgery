import type { Metadata } from "next";
import { CookieConsent } from "@/components/site/cookie-consent";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { MobileCta } from "@/components/site/mobile-cta";
import { NotFoundContent } from "@/components/site/not-found-content";
import { getSiteSettings } from "@/lib/cms/settings";

export const metadata: Metadata = { title: "Page not found" };

// Root not-found renders outside the (site) layout (e.g. unknown nested URLs), so it brings its
// own header and footer. Inside the site, src/app/(site)/not-found.tsx is used instead.
export default async function NotFound() {
  const { phone } = await getSiteSettings();
  return (
    <>
      <SiteHeader phone={phone} />
      <main id="main" className="flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter />
      <CookieConsent />
      <MobileCta phone={phone} />
    </>
  );
}
