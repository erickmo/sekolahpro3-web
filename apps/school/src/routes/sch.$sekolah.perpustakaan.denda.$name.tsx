/**
 * Redirect stub — PERP-ADR-0001.
 *
 * Detail denda lama: resolve `Denda Perpustakaan.peminjaman` via
 * `frappe.client.get_value` lalu redirect ke detail peminjaman terkait. Jika
 * gagal, fallback ke list peminjaman dengan filter `denda=ada`.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { frappeFetch } from "@sekolahpro/api-client";

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/denda/$name")({
  beforeLoad: async ({ params }) => {
    try {
      const doc = await frappeFetch<{ peminjaman?: string }>(
        "frappe.client.get_value",
        {
          doctype: "Denda Perpustakaan",
          filters: { name: params.name },
          fieldname: "peminjaman",
        },
      );
      if (doc?.peminjaman) {
        throw redirect({
          to: "/sch/$sekolah/perpustakaan/peminjaman/$name",
          params: { sekolah: params.sekolah, name: doc.peminjaman },
        });
      }
    } catch (e) {
      if (e && typeof e === "object" && (e as { isRedirect?: boolean }).isRedirect) {
        throw e;
      }
    }
    throw redirect({ to: "/sch/$sekolah/perpustakaan/peminjaman", params: { sekolah: params.sekolah }, search: { denda: "ada" } });
  },
});
