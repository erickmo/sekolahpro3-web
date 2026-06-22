import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  SectionCard,
  Select,
} from "@sekolahpro/ui";
import {
  useMyCuti,
  useSaldoCuti,
  useAjukanCuti,
  formatTanggal,
  M_MY_CUTI,
  M_SALDO_CUTI,
  type AjukanCutiInput,
} from "../api/portalPegawai";
import { cutiTone } from "../lib/badge";

const JENIS = ["Tahunan", "Sakit", "Melahirkan", "Izin Pribadi", "Cuti Besar", "Diklat"];

const EMPTY: AjukanCutiInput = {
  jenis_cuti: "Tahunan",
  tanggal_mulai: "",
  tanggal_selesai: "",
  alasan: "",
};

function CutiPage() {
  const qc = useQueryClient();
  const saldo = useSaldoCuti();
  const cuti = useMyCuti();
  const ajukan = useAjukanCuti();
  const [form, setForm] = useState<AjukanCutiInput>(EMPTY);
  const [ok, setOk] = useState<string | null>(null);

  const set = (k: keyof AjukanCutiInput, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    ajukan.mutate(form, {
      onSuccess: (name) => {
        setOk(`Pengajuan ${name} terkirim (Draft).`);
        setForm(EMPTY);
        void qc.invalidateQueries({ queryKey: [M_MY_CUTI] });
        void qc.invalidateQueries({ queryKey: [M_SALDO_CUTI] });
      },
    });
  }

  const rows = cuti.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Kepegawaian" title="Cuti Saya" description="Ajukan cuti dan pantau status pengajuan." />

      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="Ajukan Cuti" description="Pengajuan dibuat sebagai Draft lalu diproses.">
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField label="Jenis Cuti" htmlFor="jenis" required>
              <Select id="jenis" value={form.jenis_cuti} onChange={(e) => set("jenis_cuti", e.target.value)}>
                {JENIS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Tanggal Mulai" htmlFor="mulai" required>
              <Input
                id="mulai"
                type="date"
                value={form.tanggal_mulai}
                onChange={(e) => set("tanggal_mulai", e.target.value)}
                required
              />
            </FormField>
            <FormField label="Tanggal Selesai" htmlFor="selesai" required>
              <Input
                id="selesai"
                type="date"
                value={form.tanggal_selesai}
                onChange={(e) => set("tanggal_selesai", e.target.value)}
                required
              />
            </FormField>
            <FormField label="Alasan" htmlFor="alasan">
              <textarea
                id="alasan"
                rows={3}
                value={form.alasan ?? ""}
                onChange={(e) => set("alasan", e.target.value)}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Keterangan singkat (opsional)"
              />
            </FormField>

            {ajukan.isError ? (
              <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {ajukan.error instanceof Error ? ajukan.error.message : "Gagal mengirim pengajuan."}
              </div>
            ) : null}
            {ok ? (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                {ok}
              </div>
            ) : null}

            <Button type="submit" disabled={ajukan.isPending} className="w-full">
              {ajukan.isPending ? "Mengirim..." : "Ajukan Cuti"}
            </Button>
          </form>
        </SectionCard>

        <SectionCard title="Saldo Cuti" description="Sisa kuota tahun berjalan" className="lg:col-span-2" padded={false}>
          {saldo.isLoading ? (
            <p className="p-5 text-sm text-muted-fg">Memuat...</p>
          ) : saldo.isError ? (
            <p className="p-5 text-sm text-danger">Gagal memuat saldo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-fg">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-medium">Jenis</th>
                    <th className="px-5 py-2.5 text-right font-medium">Kuota</th>
                    <th className="px-5 py-2.5 text-right font-medium">Terpakai</th>
                    <th className="px-5 py-2.5 text-right font-medium">Sisa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(saldo.data ?? []).map((r) => (
                    <tr key={r.jenis_cuti}>
                      <td className="px-5 py-3 font-medium text-fg">{r.jenis_cuti}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-fg">
                        {r.kuota ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-fg">{r.terpakai}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-fg">
                        {r.sisa ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Riwayat Pengajuan" padded={false}>
        {cuti.isLoading ? (
          <p className="p-5 text-sm text-muted-fg">Memuat...</p>
        ) : cuti.isError ? (
          <p className="p-5 text-sm text-danger">Gagal memuat data cuti.</p>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada pengajuan" description="Pengajuan cuti Anda akan tampil di sini." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-fg">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Jenis</th>
                  <th className="px-5 py-2.5 text-left font-medium">Mulai</th>
                  <th className="px-5 py-2.5 text-left font-medium">Selesai</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((c) => (
                  <tr key={c.name}>
                    <td className="px-5 py-3 font-medium text-fg">{c.jenis_cuti}</td>
                    <td className="px-5 py-3 text-muted-fg tabular-nums">{formatTanggal(c.tanggal_mulai)}</td>
                    <td className="px-5 py-3 text-muted-fg tabular-nums">{formatTanggal(c.tanggal_selesai)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={cutiTone(c.status)} dot>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/cuti")({ component: CutiPage });
