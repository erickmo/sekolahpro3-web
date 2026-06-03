import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { AdBanner } from "@sekolahpro/ads";
import { SiteProvider } from "../SiteContext";
import { useSiteData, readPreviewDraft } from "../lib/site";
import { useSeo } from "../lib/seo";
import { applyTheme } from "../theme";
import { getTemplate } from "../templates/registry";
import { Nav } from "../sections/Nav";
import { Footer } from "../sections/Footer";
import { Spinner } from "../sections/primitives";
import type { SiteData } from "../types";
import type { TemplateKey } from "../constants";
import { applyDemoTemplate } from "../demo/templatePresets";
import { isDemoMode } from "../demo/demoMode";
import { DemoSwitcher } from "../demo/DemoSwitcher";

/** Fixed banner shown when the page renders an unsaved-edit preview overlay. */
function PreviewBanner() {
  return (
    <div className="sticky top-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-amber-950">
      Mode Pratinjau — menampilkan perubahan yang belum disimpan.
    </div>
  );
}

/** Resolves the per-school site from the host, then renders its template. */
export function SiteLayout() {
  const { data: site, isLoading } = useSiteData();
  const preview = readPreviewDraft() != null;
  if (isLoading || !site) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Memuat situs sekolah…" />
      </div>
    );
  }
  return (
    <>
      {preview ? <PreviewBanner /> : null}
      <SiteShell site={site} />
    </>
  );
}

function SiteShell({ site }: { site: SiteData }) {
  // Demo-only override: lets a presenter flip templates live (see DemoSwitcher).
  const [demoKey, setDemoKey] = useState<TemplateKey | null>(null);
  const demo = isDemoMode();
  const effectiveSite = useMemo(
    () => (demoKey ? applyDemoTemplate(site, demoKey) : site),
    [site, demoKey],
  );

  useEffect(() => {
    applyTheme(effectiveSite.brand, effectiveSite.theme);
  }, [effectiveSite.brand, effectiveSite.theme]);
  useSeo({ title: site.meta.metaTitle, description: site.meta.metaDescription, image: site.meta.ogImage });

  const tpl = getTemplate(effectiveSite.templateKey);
  return (
    <SiteProvider value={effectiveSite}>
      <div className={`${tpl.themeClass} flex min-h-screen flex-col`}>
        <Nav variant={tpl.navVariant} />
        <main className="flex-1">
          <Outlet />
          <div className="mx-auto max-w-5xl px-4 py-8 flex justify-center">
            <AdBanner slot="situs-content-bottom" />
          </div>
        </main>
        <Footer />
        {demo && <DemoSwitcher current={effectiveSite.templateKey} onPick={setDemoKey} />}
      </div>
    </SiteProvider>
  );
}
