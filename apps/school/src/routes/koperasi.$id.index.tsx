import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Index of `/koperasi/$id`.
 *
 * Interim approach (PR3c): the Koperasi slug equals its anchor school's
 * `kode_pendek`, which is also the `$sekolah` slug. Rather than duplicate the
 * 26 existing `$sekolah.koperasi*` route files, we redirect into the existing
 * per-school koperasi dashboard. The parent `koperasi.$id.tsx` guard has already
 * anchored the session to the matched school before this runs, giving the
 * org-level Koperasi a clean, bookmarkable top-level entry URL (`/koperasi/<id>`)
 * without forcing the user to first pick a school.
 *
 * Tradeoff: the address bar lands on `/<slug>/koperasi` after redirect.
 * Migrating the 26 sub-routes under `/koperasi/$id` is deferred until the
 * nav/link layer is decoupled from `$sekolah`.
 */
export const Route = createFileRoute("/koperasi/$id/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$sekolah/koperasi",
      params: { sekolah: params.id },
    });
  },
});
