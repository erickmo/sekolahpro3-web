// Template registry: the single place that maps a template key to its
// definition. Adding a new template = create a TemplateDef module + add one
// entry here + add a skin class in skins.css. Open/closed: no existing
// template changes. The contract test asserts these keys ⊆ TEMPLATE_KEYS.

import type { TemplateKey } from "../constants";
import { DEFAULT_TEMPLATE } from "../constants";
import { klasik } from "./Klasik";
import { modern } from "./Modern";
import { ceria } from "./Ceria";
import { aurora } from "./Aurora";
import type { TemplateDef } from "./types";

export const TEMPLATE_REGISTRY: Record<TemplateKey, TemplateDef> = {
  klasik,
  modern,
  ceria,
  aurora,
};

export function getTemplate(key: TemplateKey): TemplateDef {
  return TEMPLATE_REGISTRY[key] ?? TEMPLATE_REGISTRY[DEFAULT_TEMPLATE];
}
