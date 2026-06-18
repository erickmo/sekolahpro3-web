import { Link } from "@tanstack/react-router";
import {
  buildAkademikModules,
  activeModuleKey,
  type AkademikNavLink,
} from "../../lib/akademikNav";
import { NavDropdown } from "../shell/NavDropdown";

const PILL =
  "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";
const PILL_ACTIVE = "bg-brand text-white shadow-sm";
const PILL_IDLE = "text-muted-fg hover:bg-muted hover:text-fg";
const ITEM = "block rounded-md px-3 py-2 text-sm text-fg hover:bg-muted";

/**
 * Build Link props honoring period scope. `$ta`-scoped links carry `{sekolah, ta}`;
 * ppdb links carry only `{sekolah}`. A scoped link rendered without a TA (e.g. on a
 * ppdb page with no stored TA) falls back to the hub picker so it never points at an
 * empty `$ta`. Cast to `never` mirrors `scopedLinkProps` — TanStack's typed Link
 * rejects a runtime-string `to`, so the repo opts out of that check here.
 */
function linkProps(sekolah: string, ta: string, to: string, scoped: boolean) {
  if (scoped && !ta) {
    return { to: "/sch/$sekolah/akademik" as never, params: { sekolah } as never, search: { pick: 1 } as never };
  }
  const params = scoped ? { sekolah, ta } : { sekolah };
  return { to: to as never, params: params as never };
}

/**
 * The unified Akademik menu — one module bar (with per-module dropdowns) rendered
 * identically on every `/akademik/**` page via each layout's `ModuleShell navSlot`.
 */
export function AkademikNav({ sekolah, ta, pathname }: { sekolah: string; ta: string; pathname: string }) {
  const modules = buildAkademikModules();
  const activeKey = activeModuleKey(pathname);

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Menu Akademik">
      {modules.map((m) => {
        const active = activeKey === m.key;
        if (m.to) {
          return (
            <Link
              key={m.key}
              {...linkProps(sekolah, ta, m.to, m.scoped)}
              className={`${PILL} ${active ? PILL_ACTIVE : PILL_IDLE}`}
            >
              {m.label}
            </Link>
          );
        }
        return (
          <NavDropdown key={m.key} label={m.label} active={active} pathname={pathname}>
            {(m.items ?? []).map((it: AkademikNavLink) => (
              <li key={it.to} role="none">
                <Link role="menuitem" {...linkProps(sekolah, ta, it.to, m.scoped)} className={ITEM}>
                  {it.label}
                </Link>
              </li>
            ))}
          </NavDropdown>
        );
      })}
    </nav>
  );
}
