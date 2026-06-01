import type { ReactNode } from "react";
import type { SectionKey, TemplateKey } from "../constants";
import type { SiteData } from "../types";

/** A template is a homepage composition + chrome variant + skin class. */
export interface TemplateDef {
  key: TemplateKey;
  label: string;
  /** Skin class applied to the root wrapper (see templates/skins.css). */
  themeClass: string;
  /** Nav shape variant. */
  navVariant: TemplateKey;
  /** Homepage body: composes section components in this template's order. */
  HomeBody: () => ReactNode;
}

/** Render `node` only if the section is enabled for this school. */
export function ifEnabled(site: SiteData, key: SectionKey, node: ReactNode): ReactNode {
  return site.sections.includes(key) ? node : null;
}
