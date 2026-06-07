/**
 * Akuntansi index — folded into the unified Keuangan hub.
 *
 * The "Alur Uang" hub at /keuangan is the single finance landing (work-queue +
 * money-flow pipeline + deadlines), so the bare /akuntansi route redirects there.
 * The akuntansi sub-pages (buku-besar, anggaran, pajak, referensi) keep their own
 * URLs and render under the shared pipeline header — only this index redirects.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sch/$sekolah/akuntansi/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/sch/$sekolah/keuangan", params: { sekolah: params.sekolah } });
  },
});
