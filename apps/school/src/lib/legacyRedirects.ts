// legacyRedirects — beforeLoad factories for legacy-URL stubs left behind by
// the akademik single-door move (spec §1.6).
//
// Two flavours:
// - workspaceStubBeforeLoad: target lives under /akademik/$ta — the TA is not
//   known at redirect time, so we route through the hub with ?go= and let it
//   resolve the active TA (consumed in plan Task 7).
// - directStubBeforeLoad: target has no $ta (e.g. PPDB) — rewrite from URL
//   parts (never string-replace on pathname: a sekolah slug could equal the
//   segment being replaced).
import { redirect } from "@tanstack/react-router";

/** Shape of the context object passed to each beforeLoad factory by TanStack. */
type StubCtx = {
  params: { sekolah: string; _splat?: string };
  location: { searchStr: string };
};

/**
 * Factory for a beforeLoad that redirects a legacy workspace URL through the
 * Akademik hub using the `?go=` param.
 *
 * Use for routes whose content lives under /akademik/$ta/<root>; the TA is
 * unknown here, so the hub resolves it after the redirect.
 *
 * @param root - The workspace module root ("kelas" | "jadwal" | "ekskul").
 * @returns A beforeLoad function ready to drop into createFileRoute().
 */
export function workspaceStubBeforeLoad(root: "kelas" | "jadwal" | "ekskul") {
  return ({ params }: StubCtx): never => {
    const splat = params._splat;
    throw redirect({
      to: "/sch/$sekolah/akademik",
      params: { sekolah: params.sekolah },
      search: { go: splat ? `${root}/${splat}` : root },
      replace: true,
    });
  };
}

/**
 * Factory for a beforeLoad that rewrites a legacy route to its new direct path.
 *
 * Use for routes that have no `$ta` segment (e.g. PPDB) where the new path is
 * a static prefix under /sch/$sekolah/. Path is assembled from parts — never
 * string-replaced on the live pathname — to avoid collisions if the sekolah
 * slug happens to equal a path segment.
 *
 * @param newBase - New path base after `/sch/$sekolah/` (e.g. "akademik/ppdb").
 * @returns A beforeLoad function ready to drop into createFileRoute().
 */
export function directStubBeforeLoad(newBase: string) {
  return ({ params, location }: StubCtx): never => {
    const splat = params._splat;
    const path = splat
      ? `/sch/${params.sekolah}/${newBase}/${splat}`
      : `/sch/${params.sekolah}/${newBase}`;
    throw redirect({ href: `${path}${location.searchStr ?? ""}`, replace: true });
  };
}
