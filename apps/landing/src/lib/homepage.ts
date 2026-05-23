import { useEffect, useState } from "react";
import {
  HERO,
  MODULES,
  STATS,
  TESTIMONIAL,
  PROCESS,
  FINAL_CTA,
  type ModuleItem,
  type StatItem,
  type ProcessStep,
} from "../data/landing-static";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export interface HomepageContent {
  hero: typeof HERO;
  modules: ModuleItem[];
  stats: StatItem[];
  testimonial: typeof TESTIMONIAL;
  process: ProcessStep[];
  final_cta: typeof FINAL_CTA;
}

export const STATIC_HOMEPAGE: HomepageContent = {
  hero: HERO,
  modules: MODULES,
  stats: STATS,
  testimonial: TESTIMONIAL,
  process: PROCESS,
  final_cta: FINAL_CTA,
};

interface ApiShape {
  hero_eyebrow?: string;
  hero_line1?: string;
  hero_line2_text?: string;
  hero_line2_italic?: string;
  hero_line3?: string;
  hero_description?: string;
  cta_primary_label?: string;
  cta_primary_url?: string;
  cta_secondary_label?: string;
  cta_secondary_url?: string;
  modules?: { key?: string; title?: string; description?: string }[];
  stats?: { label?: string; value?: string; unit?: string }[];
  testimonial_quote?: string;
  testimonial_author?: string;
  testimonial_role?: string;
  process_steps?: { number?: string; title?: string; description?: string }[];
  final_cta_eyebrow?: string;
  final_cta_title_main?: string;
  final_cta_title_italic?: string;
  final_cta_body?: string;
  final_cta_primary_label?: string;
  final_cta_primary_url?: string;
  final_cta_secondary_label?: string;
  final_cta_secondary_url?: string;
}

function mapFromApi(raw: ApiShape): HomepageContent {
  const modules = (raw.modules ?? []).filter((m) => m.key && m.title).map((m) => ({
    key: m.key as string,
    title: m.title as string,
    description: m.description ?? "",
  }));
  const stats = (raw.stats ?? []).filter((s) => s.label && s.value).map((s) => {
    const item: StatItem = { label: s.label as string, value: s.value as string };
    if (s.unit) item.unit = s.unit;
    return item;
  });
  const steps = (raw.process_steps ?? []).filter((s) => s.title).map((s) => ({
    number: s.number ?? "",
    title: s.title as string,
    description: s.description ?? "",
  }));

  return {
    hero: {
      eyebrow: raw.hero_eyebrow ?? HERO.eyebrow,
      line1: raw.hero_line1 ?? HERO.line1,
      line2_text: raw.hero_line2_text ?? HERO.line2_text,
      line2_italic: raw.hero_line2_italic ?? HERO.line2_italic,
      line3: raw.hero_line3 ?? HERO.line3,
      description: raw.hero_description ?? HERO.description,
      cta_primary: {
        label: raw.cta_primary_label ?? HERO.cta_primary.label,
        url: raw.cta_primary_url ?? HERO.cta_primary.url,
      },
      cta_secondary: {
        label: raw.cta_secondary_label ?? HERO.cta_secondary.label,
        url: raw.cta_secondary_url ?? HERO.cta_secondary.url,
      },
    },
    modules: modules.length > 0 ? modules : MODULES,
    stats: stats.length > 0 ? stats : STATS,
    testimonial: {
      quote: raw.testimonial_quote ?? TESTIMONIAL.quote,
      author: raw.testimonial_author ?? TESTIMONIAL.author,
      role: raw.testimonial_role ?? TESTIMONIAL.role,
    },
    process: steps.length > 0 ? steps : PROCESS,
    final_cta: {
      eyebrow: raw.final_cta_eyebrow ?? FINAL_CTA.eyebrow,
      title_main: raw.final_cta_title_main ?? FINAL_CTA.title_main,
      title_italic: raw.final_cta_title_italic ?? FINAL_CTA.title_italic,
      body: raw.final_cta_body ?? FINAL_CTA.body,
      primary: {
        label: raw.final_cta_primary_label ?? FINAL_CTA.primary.label,
        url: raw.final_cta_primary_url ?? FINAL_CTA.primary.url,
      },
      secondary: {
        label: raw.final_cta_secondary_label ?? FINAL_CTA.secondary.label,
        url: raw.final_cta_secondary_url ?? FINAL_CTA.secondary.url,
      },
    },
  };
}

export function useHomepageContent(): HomepageContent {
  const [content, setContent] = useState<HomepageContent>(STATIC_HOMEPAGE);

  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/method/sekolahpro.api.homepage.get`, { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { message?: ApiShape }) => {
        if (cancelled || !body?.message) return;
        setContent(mapFromApi(body.message));
      })
      .catch(() => {
        // silent fallback to static defaults
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}
