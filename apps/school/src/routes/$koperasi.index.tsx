import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Index of the top-level `/$koperasi` route.
 *
 * Interim approach (PR3c): the Koperasi slug equals its anchor school's
 * `kode_pendek`, which is also the `$sekolah` slug. Rather than duplicate the
 * 26 existing `$sekolah.koperasi*` route files (dashboard + nav + 24 sub-pages),
 * we redirect into the existing per-school koperasi dashboard. This gives the
 * org-level Koperasi a clean, bookmarkable top-level entry URL
 * (`/$koperasi/<slug>`) without forcing the user to first pick a school, while
 * reusing the full koperasi module unchanged. The parent `$koperasi.tsx` guard
 * has already anchored the session to the matched school before this runs.
 *
 * Tradeoff: the address bar lands on `/<slug>/koperasi` after redirect, not
 * `/<slug>` (the koperasi route). Migrating the 26 sub-routes under `/$koperasi`
 * is deferred to a follow-up once the nav/link layer is decoupled from
 * `$sekolah`.
 */
export const Route = createFileRoute("/$koperasi/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$sekolah/koperasi",
      params: { sekolah: params.koperasi },
    });
  },
});
