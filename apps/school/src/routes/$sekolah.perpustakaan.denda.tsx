/**
 * Redirect stub — PERP-ADR-0001.
 *
 * Tab denda terpisah dihapus; URL lama di-redirect ke list peminjaman dengan
 * filter `denda=ada` agar pengguna mendarat di set peminjaman yang punya denda
 * belum lunas.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$sekolah/perpustakaan/denda")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$sekolah/perpustakaan/peminjaman", params: { sekolah: params.sekolah }, search: { denda: "ada" } });
  },
});
