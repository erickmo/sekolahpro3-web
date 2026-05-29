import type { PegawaiApi } from "./roles";

export function ApiStaffTab({ pegawai }: { pegawai: PegawaiApi }) {
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Kepegawaian Staff</h2>
      <dl className="grid grid-cols-[160px_1fr] gap-y-1 text-sm">
        <dt className="text-muted-fg">Jabatan fungsional</dt><dd>{pegawai.jabatan_fungsional ?? "—"}</dd>
        <dt className="text-muted-fg">Status kepegawaian</dt><dd>{pegawai.status_kepegawaian ?? "—"}</dd>
      </dl>
    </section>
  );
}
