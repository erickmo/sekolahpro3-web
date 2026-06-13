import { useMemo } from "react";
import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import {
  Alert,
  Badge,
  Button,
  GettingStartedCard,
  PageHeader,
  SectionCard,
  Skeleton,
  SkeletonText,
  StatCard,
  IconUsers,
  IconAlert,
  ModuleFlow,
  type ModuleFlowStep,
} from "@sekolahpro/ui";
import { DashboardWorklist } from "../components/koperasi/DashboardWorklist";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";
import { RhythmShortcuts } from "../components/koperasi/RhythmShortcuts";

const KOPERASI_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "pengaturan", label: "Pengaturan", hint: "Konfigurasi awal koperasi", href: "/kop/$sekolah/pengaturan" },
  { key: "rekening", label: "Rekening", hint: "Setup chart of account", href: "/kop/$sekolah/rekening" },
  { key: "anggota", label: "Anggota", hint: "Daftar anggota koperasi", href: "/kop/$sekolah/daftar" },
  { key: "kas-teller", label: "Kas Teller", hint: "Buka kas harian", href: "/kop/$sekolah/kas-teller" },
  { key: "transaksi", label: "Transaksi", hint: "Setoran & penarikan", href: "/kop/$sekolah/transaksi" },
  { key: "pembiayaan", label: "Pembiayaan", hint: "Pinjaman & angsuran", href: "/kop/$sekolah/pembiayaan" },
  { key: "period-close", label: "Tutup Buku", hint: "Tutup periode & SHU", href: "/kop/$sekolah/period-close" },
];
import { useResourceList } from "@sekolahpro/api-client";

/**
 * Dashboard Koperasi.
 *
 * Audit UX 2026-05-26: stub kas/anggota dihapus — hanya angka otoritatif.
 * Audit UX 2026-06-13 (konsultasi UI/UX + COO + teller):
 *   - Tambah PageGuide + banner "kas belum dibuka" (cek sesi ber-tanggal hari
 *     ini, bukan sekadar tidak ada sesi Aktif, agar tidak salah nag sore hari).
 *   - Hapus StatCard "Saldo Kas (GL)" placeholder beserta alert penjelasnya —
 *     kartu "—" permanen = noise; integrasi GL menyusul dari backend.
 *   - "Aksi Cepat" 13 item rata diganti RHYTHM_GROUPS — pintasan dikelompokkan
 *     per irama kerja (harian/berkala/tahunan) supaya staf baru tahu mulai dari
 *     mana; menu lengkap tetap di sidebar.
 *   - ModuleFlow diturunkan ke bawah: edukasi setup sekali jalan, bukan tugas harian.
 */

type AnggotaRow = {
  name: string;
  nomor_anggota?: string;
  nasabah?: string;
  status?: string;
  jenis_anggota?: string;
  tanggal_masuk?: string;
};

type SesiRow = { name: string };

const STATUS_TONE: Record<string, "success" | "neutral" | "danger" | "warning"> = {
  Aktif: "success",
  Keluar: "danger",
};

function KoperasiDashboardPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const anggotaQ = useResourceList<AnggotaRow>("Anggota Koperasi", {
    fields: ["name", "nomor_anggota", "nasabah", "status", "jenis_anggota", "tanggal_masuk"],
    limit_page_length: 0,
  });

  // Sesi Kas Teller yang belum di-closing — otoritatif (BUKAN stub).
  const sesiAktifQ = useResourceList<SesiRow>("Sesi Kas Teller", {
    fields: ["name"],
    filters: [["status", "=", "Aktif"]],
    limit_page_length: 50,
  });

  // Sesi apa pun yang tercatat hari ini — pembeda "belum buka kas" vs "sudah
  // tutup sore ini", supaya banner pagi tidak salah nag (SA review 2026-06-13).
  const sesiTodayQ = useResourceList<SesiRow>("Sesi Kas Teller", {
    fields: ["name"],
    filters: [["tanggal", "=", today]],
    limit_page_length: 1,
  });

  const rows = anggotaQ.data ?? [];

  const stats = useMemo(() => {
    const aktif = rows.filter((a) => a.status === "Aktif").length;
    const kasTellerBelumClosing = sesiAktifQ.data?.length ?? 0;
    return { aktif, kasTellerBelumClosing };
  }, [rows, sesiAktifQ.data]);

  const isZeroState = !anggotaQ.isLoading && !anggotaQ.isError && rows.length === 0;

  const kasBelumDibuka =
    !sesiTodayQ.isLoading && !sesiTodayQ.isError && (sesiTodayQ.data?.length ?? 0) === 0;

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
          description="Daftarkan anggota pertama lewat alur terpandu, lalu buka kas teller untuk mulai mencatat transaksi."
          primaryAction={{ label: "Pendaftaran Anggota Baru", href: "/kop/$sekolah/onboarding" }}
          secondaryAction={{ label: "Buka Kas Teller", href: "/kop/$sekolah/kas-teller" }}
          renderLink={(href, children, className) => (
            <Link to={href as "/kop/$sekolah/onboarding"} params={{ sekolah }} className={className}>
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
        actions={
          <Button onClick={() => navigate({ to: "/kop/$sekolah/onboarding", params: { sekolah } })}>
            <span className="h-4 w-4 mr-1.5"><IconUsers /></span>
            Pendaftaran Anggota Baru
          </Button>
        }
      />

      <KoperasiPageGuide id="dashboard" />

      {kasBelumDibuka ? (
        <Alert tone="warning" title="Kas belum dibuka hari ini" statusRole>
          Belum ada sesi kas tercatat hari ini. Buka sesi kas dulu supaya transaksi tunai bisa
          dilayani.{" "}
          <Link
            to="/kop/$sekolah/kas-teller"
            params={{ sekolah }}
            className="font-medium text-brand underline"
          >
            Buka Kas Teller →
          </Link>
        </Alert>
      ) : null}

      <DashboardWorklist sekolah={sekolah} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Anggota (Aktif)"
          value={anggotaQ.isLoading ? "…" : stats.aktif.toLocaleString("id-ID")}
          {...(anggotaQ.isLoading ? { hint: "memuat..." } : { hint: "status = Aktif" })}
          icon={<IconUsers />}
          accent="brand"
          urgency="normal"
          actionHref="/kop/$sekolah/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Kas Teller Belum Closing"
          value={sesiAktifQ.isLoading ? "…" : stats.kasTellerBelumClosing.toLocaleString("id-ID")}
          hint={
            stats.kasTellerBelumClosing > 0
              ? "sesi Aktif — ajukan tutup kas sebelum pulang"
              : "tidak ada sesi Aktif menggantung"
          }
          icon={<IconAlert />}
          accent="amber"
          urgency={stats.kasTellerBelumClosing > 0 ? "critical" : "normal"}
          actionHref="/kop/$sekolah/kas-teller"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <RhythmShortcuts />

      <ModuleFlow
        title="Alur Operasi Koperasi"
        description="Langkah setup awal menjalankan koperasi — panduan sekali jalan, bukan rutinitas harian."
        steps={KOPERASI_FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/kop/$sekolah/pengaturan"} params={{ sekolah }}>
            {children}
          </Link>
        )}
      />

      <SectionCard
        title="Anggota Terbaru"
        description="5 keanggotaan terakhir tercatat."
        action={
          <Link to="/kop/$sekolah/daftar" params={{ sekolah }} className="text-xs text-brand hover:underline">
            Lihat semua
          </Link>
        }
      >
        {anggotaQ.isLoading ? (
          <SkeletonText lines={5} aria-label="Memuat anggota terbaru" />
        ) : terbaru.length === 0 ? (
          <div className="text-sm text-muted-fg">Belum ada anggota.</div>
        ) : (
          <ul className="divide-y divide-border -my-2">
            {terbaru.map((a) => (
              <li key={a.name} className="py-2.5 flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" aria-label="avatar" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-fg truncate">
                    {a.nasabah ?? a.nomor_anggota ?? a.name}
                  </div>
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
        <Alert tone="danger" title="Gagal memuat anggota">
          {(anggotaQ.error as Error).message}
        </Alert>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/kop/$sekolah/")({ component: KoperasiDashboardPage });
