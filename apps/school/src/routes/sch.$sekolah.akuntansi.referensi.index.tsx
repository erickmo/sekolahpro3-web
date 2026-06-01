/**
 * Referensi & Pengaturan overview — Keuangan hub.
 *
 * Navigation hub for the accounting reference sub-module (fiscal year, periode,
 * kurs, pengaturan modul). Presentation-only redesign: adds a role-aware page
 * guide and role chips for framing. This page fetches no data, so it carries no
 * data-derived visualization. The navigation tiles and scopedLinkProps wiring
 * are preserved verbatim.
 */
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import { scopedLinkProps } from "../lib/scoped";
import { KeuanganPageGuide, KeuanganRoleChips } from "../components/keuangan";
import { useKeuanganRole, type KeuanganRole } from "../lib/keuanganRole";
import { useState } from "react";

function ReferensiOverview() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const role = useKeuanganRole();
  const [activeRole, setActiveRole] = useState<KeuanganRole>(role.primary);
  const tile = (label: string, hint: string, path: string) => (
    <Link {...scopedLinkProps(sekolah, path)} className="rounded-md border border-border p-3 hover:bg-muted/60">
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs text-muted-fg">{hint}</div>
    </Link>
  );
  return (
    <div className="space-y-4">
      <PageHeader title="Referensi & Pengaturan" description="Konfigurasi periode, kurs, dan pengaturan modul." />

      <KeuanganRoleChips active={activeRole} onSelect={setActiveRole} />

      <KeuanganPageGuide
        storageId="referensi-overview"
        intro="Submenu di halaman ini menyiapkan fondasi akuntansi: kerangka waktu (tahun fiskal & periode), nilai tukar, serta pengaturan pajak dan akun default yang dipakai seluruh transaksi."
        steps={[
          { title: "Tetapkan tahun fiskal", detail: "Akuntan membuat Fiscal Year sebagai kerangka tahun anggaran sebelum mencatat jurnal atau menyusun budget.", roles: ["akuntan"] },
          { title: "Buka periode akuntansi", detail: "Bagi tahun fiskal menjadi periode bulanan/kuartalan. Periode yang ditutup mencegah perubahan transaksi lama.", roles: ["akuntan"] },
          { title: "Catat kurs bila pakai valas", detail: "Kasir/akuntan mengisi Currency Exchange hanya jika ada transaksi mata uang asing.", roles: ["kasir", "akuntan"] },
          { title: "Lengkapi pengaturan modul", detail: "Bendahara mengisi NPWP, tarif pajak default, dan NSFP agar perhitungan PPN/PPh otomatis benar.", roles: ["bendahara"] },
        ]}
        tips={[
          "Urutan ideal: Fiscal Year dulu, lalu Accounting Period, baru transaksi.",
          "Pengaturan Modul cukup diisi sekali di awal dan diperbarui saat tarif pajak berubah.",
        ]}
      />

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
