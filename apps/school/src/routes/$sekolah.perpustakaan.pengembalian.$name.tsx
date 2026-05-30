/**
 * Redirect stub — PERP-ADR-0001.
 *
 * Detail rute pengembalian lama: resolve `Pengembalian Buku.peminjaman` lewat
 * `frappe.client.get_value` lalu redirect ke detail peminjaman terkait. Jika
 * gagal (404, network, dst.), fallback ke list peminjaman dengan status
 * "Selesai".
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { frappeFetch } from "@sekolahpro/api-client";

export const Route = createFileRoute("/$sekolah/perpustakaan/pengembalian/$name")({
  beforeLoad: async ({ params }) => {
    try {
      const doc = await frappeFetch<{ peminjaman?: string }>(
        "frappe.client.get_value",
        {
          doctype: "Pengembalian Buku",
          filters: { name: params.name },
          fieldname: "peminjaman",
        },
      );
      if (doc?.peminjaman) {
        throw redirect({
          to: "/$sekolah/perpustakaan/peminjaman/$name",
          params: { sekolah: params.sekolah, name: doc.peminjaman },
        });
      }
    } catch (e) {
      // Re-throw TanStack redirect errors so navigation proceeds.
      if (e && typeof e === "object" && (e as { isRedirect?: boolean }).isRedirect) {
        throw e;
      }
      // Any other failure falls through to list redirect below.
    }
    throw redirect({ to: "/$sekolah/perpustakaan/peminjaman", params: { sekolah: params.sekolah }, search: { status: "Selesai" } });
  },
});
