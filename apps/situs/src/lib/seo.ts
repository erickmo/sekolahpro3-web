import { useEffect } from "react";

/**
 * Client-side SEO. vite-react-ssg pre-renders ROUTES not TENANTS, so per-school
 * meta can't be baked at build time; we set it on the client here. Production
 * crawler SEO uses a server-side meta-injection path (documented in the ADR).
 */
export function useSeo(opts: { title: string; description?: string; image?: string | null }): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = opts.title;
    setMeta("description", opts.description);
    setMetaProperty("og:title", opts.title);
    setMetaProperty("og:description", opts.description);
    if (opts.image) setMetaProperty("og:image", opts.image);
  }, [opts.title, opts.description, opts.image]);
}

function upsert(selector: string, create: () => HTMLMetaElement, value: string | undefined): void {
  if (!value) return;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setMeta(name: string, value: string | undefined): void {
  upsert(`meta[name="${name}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute("name", name);
    return m;
  }, value);
}

function setMetaProperty(property: string, value: string | undefined): void {
  upsert(`meta[property="${property}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute("property", property);
    return m;
  }, value);
}
