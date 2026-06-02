import { useSite } from "../SiteContext";
import { getTemplate } from "../templates/registry";

/** Homepage: delegates composition to the school's chosen template. */
export function Home() {
  const site = useSite();
  const tpl = getTemplate(site.templateKey);
  return <tpl.HomeBody />;
}
