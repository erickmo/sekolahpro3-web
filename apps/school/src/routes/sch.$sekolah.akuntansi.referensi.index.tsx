import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import { scopedLinkProps } from "../lib/scoped";

function ReferensiOverview() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const tile = (label: string, hint: string, path: string) => (
    <Link {...scopedLinkProps(sekolah, path)} className="rounded-md border border-border p-3 hover:bg-muted/60">
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs text-muted-fg">{hint}</div>
    </Link>
  );
  return (
    <div className="space-y-4">
      <PageHeader title="Referensi & Pengaturan" description="Konfigurasi periode, kurs, dan pengaturan modul." />
      <SectionCard title="Pilih Submenu">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tile("Fiscal Year", "Tahun fiskal perusahaan", "/akuntansi/referensi/fiscal-year")}
          {tile("Accounting Period", "Periode akuntansi (bulan/quarter)", "/akuntansi/referensi/period")}
          {tile("Currency Exchange", "Kurs valas harian", "/akuntansi/referensi/currency")}
          {tile("Pengaturan Modul", "Vernon Accounting Settings (NPWP, NSFP, akun default)", "/akuntansi/referensi/settings")}
        </div>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/referensi/")({ component: ReferensiOverview });
