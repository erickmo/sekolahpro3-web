import { useMemo, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AttentionList,
  type AttentionItem,
  Badge,
  GettingStartedCard,
  PageHeader,
  SectionCard,
  StatCard,
  IconUsers,
  IconWallet,
  IconChart,
  IconAlert,
  IconFile,
  IconId,
  IconCheck,
  IconSettings,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { ANGGOTA_LIST, formatRupiah } from "../data/koperasi";

// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX (prev versions): "Saldo Kas" pernah dihitung sebagai
//   totalSimpanan - sisaPinjaman
// Itu SALAH — formula tersebut adalah equity gap (selisih ekuitas), bukan
// kas/cash on hand. Saldo Kas = kas teller + saldo bank koperasi, harus
// berasal dari akun kas pada GL (General Ledger), BUKAN turunan simpanan
// dikurangi pinjaman. Jangan dikembalikan ke formula lama tanpa diskusi.
// ─────────────────────────────────────────────────────────────────────────────
const SALDO_KAS_STUB = 124_750_000; // rupiah — ganti saat akun kas GL siap di backend
const KAS_TELLER_BELUM_CLOSING_STUB = 1; // jumlah teller belum tutup hari ini (stub)
const TODAY_ISO = "2026-05-25";

type AnggotaRow = {
  name: string;
  nomor_anggota?: string;
  nasabah?: string;
  status?: string;
  jenis_anggota?: string;
  tanggal_masuk?: string;
};

const QUICK_ACTIONS: {
  to: string;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  { to: "/koperasi/transaksi", label: "Transaksi", description: "Setor, tarik, dan transaksi simpanan.", icon: <IconWallet /> },
  { to: "/koperasi/pembiayaan", label: "Pembiayaan", description: "Pengajuan dan pencairan pinjaman.", icon: <IconFile /> },
  { to: "/koperasi/angsuran", label: "Angsuran", description: "Pembayaran cicilan pinjaman anggota.", icon: <IconChart /> },
  { to: "/koperasi/rekening", label: "Rekening", description: "Kelola rekening simpanan anggota.", icon: <IconId /> },
  { to: "/koperasi/kartu", label: "Kartu RFID", description: "Pengelolaan kartu anggota.", icon: <IconId /> },
  { to: "/koperasi/emoney", label: "E-Money", description: "Saldo dan top up e-money.", icon: <IconWallet /> },
  { to: "/koperasi/kas-teller", label: "Kas Teller", description: "Pembukaan dan tutup kas harian.", icon: <IconWallet /> },
  { to: "/koperasi/zis", label: "ZIS", description: "Zakat, Infak, dan Sedekah.", icon: <IconCheck /> },
  { to: "/koperasi/wakaf", label: "Wakaf", description: "Catatan program wakaf.", icon: <IconCheck /> },
  { to: "/koperasi/shu", label: "SHU", description: "Sisa Hasil Usaha tahunan.", icon: <IconChart /> },
  { to: "/koperasi/laporan", label: "Laporan", description: "Neraca, laba rugi, dan laporan lain.", icon: <IconChart /> },
  { to: "/koperasi/pengaturan", label: "Pengaturan", description: "Konfigurasi modul koperasi.", icon: <IconSettings /> },
];

const STATUS_TONE: Record<string, "success" | "neutral" | "danger" | "warning"> = {
  Aktif: "success",
  "Non-aktif": "neutral",
  Keluar: "danger",
  Pending: "warning",
};

function KoperasiDashboardPage() {
  // Fetch all anggota (limit 0 = no limit per Frappe). For very large schools
  // this should be replaced with backend aggregations.
  const anggotaQ = useResourceList<AnggotaRow>("Anggota Koperasi", {
    fields: ["name", "nomor_anggota", "nasabah", "status", "jenis_anggota", "tanggal_masuk"],
    limit_page_length: 0,
  });

  const rows = anggotaQ.data ?? [];

  const stats = useMemo(() => {
    const aktif = rows.filter((a) => a.status === "Aktif").length;

    // Volume transaksi hari ini (Rp) — derive dari mock data koperasi.
    // TODO(api): ganti dengan agregasi doctype `Transaksi Simpanan` filter
    // tanggal = TODAY_ISO.
    const volumeHariIni = ANGGOTA_LIST
      .flatMap((a) => a.simpanan)
      .filter((s) => s.tanggal === TODAY_ISO)
      .reduce((sum, s) => sum + s.jumlah, 0);

    // Pinjaman Macet — count + total tunggakan (sisaPokok).
    // TODO(api): ganti dengan query Pinjaman.status = "Macet".
    const pinjamanMacet = ANGGOTA_LIST.flatMap((a) => a.pinjaman).filter(
      (p) => p.status === "Macet",
    );
    const macetCount = pinjamanMacet.length;
    const macetTunggakan = pinjamanMacet.reduce((s, p) => s + p.sisaPokok, 0);

    return {
      aktif,
      volumeHariIni,
      macetCount,
      macetTunggakan,
      kasTellerBelumClosing: KAS_TELLER_BELUM_CLOSING_STUB,
    };
  }, [rows]);

  const perluPerhatian = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    // Pinjaman macet — aggregate dari ANGGOTA_LIST (mock).
    if (stats.macetCount > 0) {
      items.push({
        id: "pinjaman-macet",
        label: `${stats.macetCount} pinjaman macet`,
        description: `Tunggakan pokok ${formatRupiah(stats.macetTunggakan)}`,
        tone: "danger",
        badge: "Macet",
        actionLabel: "Restrukturisasi",
        actionHref: "/koperasi/pembiayaan",
      });
    }
    // Saldo minus rekening — derive dari simpanan; mock data tidak menghasilkan
    // saldo minus, jadi sementara tampilkan hanya jika ada.
    const saldoMinusCount = ANGGOTA_LIST.filter((a) =>
      a.simpanan.some((s) => (s.saldoSetelah ?? 0) < 0),
    ).length;
    if (saldoMinusCount > 0) {
      items.push({
        id: "saldo-minus",
        label: `${saldoMinusCount} rekening saldo minus`,
        description: "Perlu ditinjau dan dikoreksi",
        tone: "danger",
        badge: "Saldo",
        actionLabel: "Tinjau Rekening",
        actionHref: "/koperasi/rekening",
      });
    }
    if (stats.kasTellerBelumClosing > 0) {
      items.push({
        id: "kas-teller-open",
        label: `${stats.kasTellerBelumClosing} kas teller belum closing`,
        description: "Wajib tutup kas sebelum akhir hari",
        tone: "warning",
        badge: "Kas",
        actionLabel: "Tutup Kas",
        actionHref: "/koperasi/kas-teller",
      });
    }
    // Angsuran telat — aggregate dari mock.
    const telatCount = ANGGOTA_LIST.flatMap((a) => a.angsuran).filter(
      (a) => a.status === "Telat",
    ).length;
    if (telatCount > 0) {
      items.push({
        id: "angsuran-telat",
        label: `${telatCount} angsuran telat`,
        description: "Anggota terlambat membayar cicilan",
        tone: "warning",
        badge: "Telat",
        actionLabel: "Tagih",
        actionHref: "/koperasi/angsuran",
      });
    }
    return items;
  }, [stats.macetCount, stats.macetTunggakan, stats.kasTellerBelumClosing]);

  const isZeroState = !anggotaQ.isLoading && !anggotaQ.isError && rows.length === 0;

  const terbaru = useMemo(() => {
    return [...rows]
      .filter((r) => r.tanggal_masuk)
      .sort((a, b) => (a.tanggal_masuk! < b.tanggal_masuk! ? 1 : -1))
      .slice(0, 5);
  }, [rows]);

  if (isZeroState) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Layanan"
          title="Dashboard Koperasi"
          description="Ringkasan koperasi sekolah, aksi cepat, dan hal yang perlu ditindaklanjuti."
        />
        <GettingStartedCard
          icon={<IconUsers />}
          title="Koperasi belum dikonfigurasi"
          description="Tambah anggota koperasi pertama dan buka kas teller untuk mulai mencatat transaksi."
          primaryAction={{ label: "Tambah Anggota", href: "/koperasi/daftar" }}
          secondaryAction={{ label: "Buka Kas Teller", href: "/koperasi/kas-teller" }}
          renderLink={(href, children, className) => (
            <Link to={href as "/koperasi/daftar"} className={className}>
              {children}
            </Link>
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Layanan"
        title="Dashboard Koperasi"
        description="Ringkasan koperasi sekolah, aksi cepat, dan hal yang perlu ditindaklanjuti."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Anggota (Aktif)"
          value={stats.aktif.toLocaleString("id-ID")}
          {...(anggotaQ.isLoading ? { hint: "memuat..." } : { hint: "status = Aktif" })}
          icon={<IconUsers />}
          accent="brand"
          urgency="normal"
          actionHref="/koperasi/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Saldo Kas"
          value={formatRupiah(SALDO_KAS_STUB)}
          hint="Bukan turunan simpanan/pinjaman — wajib dari akun kas GL."
          icon={<IconWallet />}
          accent="emerald"
          urgency="normal"
          actionHref="/koperasi/kas-teller"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Volume Transaksi Hari Ini"
          value={formatRupiah(stats.volumeHariIni)}
          hint={`tanggal ${TODAY_ISO}`}
          icon={<IconChart />}
          accent="violet"
          urgency="normal"
          actionHref="/koperasi/transaksi"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Pinjaman Macet"
          value={stats.macetCount.toLocaleString("id-ID")}
          hint={
            stats.macetCount > 0
              ? `tunggakan ${formatRupiah(stats.macetTunggakan)}`
              : "tidak ada tunggakan"
          }
          icon={<IconAlert />}
          accent="rose"
          urgency={stats.macetCount > 0 ? "critical" : "normal"}
          actionHref="/koperasi/angsuran"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Kas Teller Belum Closing"
          value={stats.kasTellerBelumClosing.toLocaleString("id-ID")}
          hint={
            stats.kasTellerBelumClosing > 0
              ? "wajib tutup kas hari ini"
              : "semua teller sudah closing"
          }
          icon={<IconAlert />}
          accent="amber"
          urgency={stats.kasTellerBelumClosing > 0 ? "critical" : "normal"}
          actionHref="/koperasi/kas-teller"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <SectionCard title="Aksi Cepat" description="Pintasan ke modul-modul koperasi yang umum digunakan.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group flex items-start gap-3 rounded-lg border border-border bg-bg p-3 hover:border-brand hover:bg-muted/30 transition-colors"
            >
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-fg group-hover:bg-brand/10 group-hover:text-brand">
                {q.icon}
              </span>
              <div className="min-w-0">
                <div className="font-medium text-fg group-hover:text-brand">{q.label}</div>
                <div className="text-xs text-muted-fg">{q.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Perlu Perhatian"
        description="Risiko pembiayaan, saldo, dan kas yang butuh tindak lanjut."
      >
        <AttentionList
          items={perluPerhatian}
          renderLink={(href, children) => (
            <Link to={href as "/koperasi/pembiayaan"}>{children}</Link>
          )}
        />
      </SectionCard>

      <SectionCard
        title="Anggota Terbaru"
        description="5 keanggotaan terakhir tercatat."
        action={
          <Link to="/koperasi/daftar" className="text-xs text-brand hover:underline">
            Lihat semua
          </Link>
        }
      >
        {anggotaQ.isLoading ? (
          <div className="text-sm text-muted-fg">Memuat...</div>
        ) : terbaru.length === 0 ? (
          <div className="text-sm text-muted-fg">Belum ada anggota.</div>
        ) : (
          <ul className="divide-y divide-border -my-2">
            {terbaru.map((a) => (
              <li key={a.name} className="py-2.5 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-fg truncate">{a.nasabah ?? a.nomor_anggota ?? a.name}</div>
                  <div className="text-xs text-muted-fg truncate tabular-nums">
                    {a.nomor_anggota ?? a.name} · {a.jenis_anggota ?? "—"}
                  </div>
                </div>
                {a.status ? (
                  <Badge tone={STATUS_TONE[a.status] ?? "neutral"} dot>
                    {a.status}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {anggotaQ.isError ? (
        <p className="text-xs text-rose-600 inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5"><IconFile /></span>
          Gagal memuat: {(anggotaQ.error as Error).message}
        </p>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/koperasi/")({ component: KoperasiDashboardPage });
