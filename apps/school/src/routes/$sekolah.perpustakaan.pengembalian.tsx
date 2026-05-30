/**
 * Redirect stub — PERP-ADR-0001.
 *
 * The dedicated `/perpustakaan/pengembalian` route was merged into the unified
 * peminjaman hub. This stub preserves the old URL by redirecting to the
 * peminjaman list filtered to "Selesai" (returned loans).
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$sekolah/perpustakaan/pengembalian")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$sekolah/perpustakaan/peminjaman", params: { sekolah: params.sekolah }, search: { status: "Selesai" } });
  },
});
