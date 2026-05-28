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

export const Route = createFileRoute("/perpustakaan/pengembalian/$name")({
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
          to: "/perpustakaan/peminjaman/$name",
          params: { name: doc.peminjaman },
        });
      }
    } catch (e) {
      // Re-throw TanStack redirect errors so navigation proceeds.
      if (e && typeof e === "object" && (e as { isRedirect?: boolean }).isRedirect) {
        throw e;
      }
      // Any other failure falls through to list redirect below.
    }
    throw redirect({ to: "/perpustakaan/peminjaman", search: { status: "Selesai" } });
  },
});
