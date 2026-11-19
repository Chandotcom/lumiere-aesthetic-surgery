import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { AttributionCapture } from "@/components/site/attribution";
import { ConsentedAnalytics } from "@/components/site/consented-analytics";
import { CookieConsent } from "@/components/site/cookie-consent";
import { MobileCta } from "@/components/site/mobile-cta";
import { PreviewBanner } from "@/components/site/preview-banner";
import { getSiteSettings } from "@/lib/cms/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Cached; refreshed when the contact settings are published.
  const { phone } = await getSiteSettings();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      <PreviewBanner />
      <SiteHeader phone={phone} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <MobileCta phone={phone} />
      {/* Optional tools wait for consent. Never add ad pixels without gating them the same way. */}
      <CookieConsent />
      <ConsentedAnalytics />
      <AttributionCapture />
    </>
  );
}
