import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AdBanner } from "@sekolahpro/ads";
import { SiteProvider } from "../SiteContext";
import { useSiteData } from "../lib/site";
import { useSeo } from "../lib/seo";
import { applyTheme } from "../theme";
import { getTemplate } from "../templates/registry";
import { Nav } from "../sections/Nav";
import { Footer } from "../sections/Footer";
import { Spinner } from "../sections/primitives";
import type { SiteData } from "../types";

/** Resolves the per-school site from the host, then renders its template. */
export function SiteLayout() {
  const { data: site, isLoading } = useSiteData();
  if (isLoading || !site) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Memuat situs sekolah…" />
      </div>
    );
  }
  return <SiteShell site={site} />;
}

function SiteShell({ site }: { site: SiteData }) {
  useEffect(() => {
    applyTheme(site.brand, site.theme);
  }, [site.brand, site.theme]);
  useSeo({ title: site.meta.metaTitle, description: site.meta.metaDescription, image: site.meta.ogImage });

  const tpl = getTemplate(site.templateKey);
  return (
    <SiteProvider value={site}>
      <div className={`${tpl.themeClass} flex min-h-screen flex-col`}>
        <Nav variant={tpl.navVariant} />
        <main className="flex-1">
          <Outlet />
          <div className="mx-auto max-w-5xl px-4 py-8 flex justify-center">
            <AdBanner slot="situs-content-bottom" />
          </div>
        </main>
        <Footer />
      </div>
    </SiteProvider>
  );
}
