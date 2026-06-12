import { Link } from "@tanstack/react-router";
import { SectionCard, IconAlert, IconChart, IconCheck, IconClock, IconFile, IconUsers, IconWallet } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { WorklistCard } from "./WorklistCard";
import {
  isOverdue,
  summarizeApprovals,
  splitTransaksiByJenis,
  capLabel,
  countDueWithin,
  splitByStatus,
  isPeriodePastDue,
} from "../../lib/koperasi/worklist";

/**
 * Supervisor "Tugas Hari Ini" worklist. Every count is derived from existing
 * doctypes via useResourceList (no new backend). Surfaces what must be cleared
 * today — closings awaiting approval, past-due open periods, pending permohonan,
 * overdue installments, hanging PPATK reports, dormant accounts, the onboarding
 * pipeline — each linking to the clearing screen.
 */

const CAP = 100;

// Proactive chase window for upcoming installments (COO consult 2026-06-13).
const DUE_SOON_DAYS = 7;

// Five approval doctypes share the status_permohonan='Diajukan' lifecycle.
const PERMOHONAN_DOCTYPES = [
  "Permohonan Buka Rekening",
  "Permohonan Tutup Rekening",
  "Permohonan Blokir Rekening",
  "Permohonan Unblokir Rekening",
  "Permohonan Aktivasi Dormant",
] as const;

// Non-final goAML report states — anything here still needs staff action.
const PPATK_PENDING_STATUSES = ["Draft", "Pending Submit", "Rejected"];

const ctaClass = "inline-flex text-xs font-medium text-brand hover:underline";

export function DashboardWorklist({ sekolah }: { sekolah: string }) {
  const today = new Date().toISOString().slice(0, 10);

  const closingQ = useResourceList<{ name: string }>("Sesi Kas Teller", {
    fields: ["name"],
    filters: [["status", "=", "Pending Approval"]],
    limit_page_length: CAP,
  });

  // Per-type pending approvals. PERMOHONAN_DOCTYPES is a module constant so hook
  // order stays stable across renders.
  const approvalQueries = PERMOHONAN_DOCTYPES.map((dt) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useResourceList<{ name: string }>(dt, {
      fields: ["name"],
      filters: [["status_permohonan", "=", "Diajukan"]],
      limit_page_length: CAP,
    }),
  );
  const approvals = summarizeApprovals(
    PERMOHONAN_DOCTYPES.map((dt, i) => ({ key: dt, count: approvalQueries[i]?.data?.length ?? 0 })),
  );
  const approvalsLoading = approvalQueries.some((q) => q.isLoading);

  const tunggakanQ = useResourceList<{ name: string }>("Jadwal Angsuran", {
    fields: ["name"],
    filters: [["status", "=", "Tunggakan"]],
    limit_page_length: CAP,
  });
  const belumQ = useResourceList<{ name: string; status?: string; tanggal_jatuh_tempo?: string }>(
    "Jadwal Angsuran",
    {
      fields: ["name", "status", "tanggal_jatuh_tempo"],
      filters: [["status", "=", "Belum"]],
      limit_page_length: CAP,
    },
  );
  const overdueBelum = (belumQ.data ?? []).filter((r) => isOverdue(r, today)).length;
  const tunggakanTotal = (tunggakanQ.data?.length ?? 0) + overdueBelum;
  const dueSoon = countDueWithin(belumQ.data ?? [], today, DUE_SOON_DAYS);

  const ppatkQ = useResourceList<{ name: string; status?: string }>("Laporan PPATK", {
    fields: ["name", "status"],
    filters: [["status", "in", PPATK_PENDING_STATUSES]],
    limit_page_length: CAP,
  });
  const ppatkSplit = splitByStatus(ppatkQ.data ?? []);
  const ppatkTotal = ppatkQ.data?.length ?? 0;
  const ppatkHint = `Draft ${ppatkSplit.Draft ?? 0} · Pending ${ppatkSplit["Pending Submit"] ?? 0} · Ditolak ${ppatkSplit.Rejected ?? 0}`;

  // Open is the normal working state; only past-due Open periods need attention.
  const periodeQ = useResourceList<{ name: string; status?: string; tanggal_akhir?: string }>(
    "Periode Tutup Koperasi",
    {
      fields: ["name", "status", "tanggal_akhir"],
      filters: [["status", "=", "Open"]],
      limit_page_length: CAP,
    },
  );
  const periodePastDue = (periodeQ.data ?? []).filter((r) => isPeriodePastDue(r, today)).length;

  const dormantQ = useResourceList<{ name: string }>("Rekening Simpanan", {
    fields: ["name"],
    filters: [["status", "=", "Dormant"]],
    limit_page_length: CAP,
  });

  const pipelineQ = useResourceList<{ name: string }>("Anggota Koperasi", {
    fields: ["name"],
    filters: [["status", "=", "Calon Anggota"]],
    limit_page_length: CAP,
  });

  const txTodayQ = useResourceList<{ name: string; jenis: string }>("Transaksi Simpanan", {
    fields: ["name", "jenis"],
    filters: [["tanggal", "=", today]],
    limit_page_length: 0,
  });
  const txSplit = splitTransaksiByJenis(txTodayQ.data ?? []);
  const txTotal = txTodayQ.data?.length ?? 0;
  const txHint = `Setor ${txSplit.Setor ?? 0} · Tarik ${txSplit.Tarik ?? 0} · Transfer ${txSplit.Transfer ?? 0}`;

  const closingCount = closingQ.data?.length ?? 0;
  const dormantCount = dormantQ.data?.length ?? 0;
  const pipelineCount = pipelineQ.data?.length ?? 0;

  return (
    <SectionCard
      title="Tugas Hari Ini"
      description="Hal yang perlu ditindaklanjuti supervisor — diturunkan dari data koperasi terkini."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <WorklistCard
          title="Closing Menunggu Persetujuan"
          value={capLabel(closingCount, CAP)}
          attention={closingCount > 0}
          tone="critical"
          icon={<IconAlert />}
          loading={closingQ.isLoading}
          isError={closingQ.isError}
          hint="Sesi kas teller menunggu approval Anda"
          zeroLabel="Tidak ada closing tertunda"
          action={<Link to="/kop/$sekolah/kas-teller" params={{ sekolah }} className={ctaClass}>Tinjau kas teller →</Link>}
        />
        <WorklistCard
          title="Periode Lewat Tanggal Akhir"
          value={capLabel(periodePastDue, CAP)}
          attention={periodePastDue > 0}
          tone="critical"
          icon={<IconClock />}
          loading={periodeQ.isLoading}
          isError={periodeQ.isError}
          hint="Periode Open yang sudah lewat tanggal akhir — segera tutup"
          zeroLabel="Tidak ada periode terlambat ditutup"
          action={<Link to="/kop/$sekolah/period-close" params={{ sekolah }} className={ctaClass}>Buka tutup periode →</Link>}
        />
        <WorklistCard
          title="Persetujuan Menunggu"
          value={capLabel(approvals.total, CAP * PERMOHONAN_DOCTYPES.length)}
          attention={approvals.total > 0}
          tone="warning"
          icon={<IconCheck />}
          loading={approvalsLoading}
          hint="Permohonan rekening menunggu keputusan"
          zeroLabel="Antrian persetujuan kosong"
          action={<Link to="/kop/$sekolah/persetujuan" params={{ sekolah }} className={ctaClass}>Buka inbox persetujuan →</Link>}
        />
        <WorklistCard
          title="Angsuran Tunggakan"
          value={capLabel(tunggakanTotal, CAP * 2)}
          attention={tunggakanTotal > 0}
          tone="critical"
          icon={<IconClock />}
          loading={tunggakanQ.isLoading || belumQ.isLoading}
          hint={`Jatuh tempo ${DUE_SOON_DAYS} hari ke depan: ${dueSoon} — kejar lebih awal`}
          zeroLabel="Tidak ada tunggakan"
          action={<Link to="/kop/$sekolah/angsuran" params={{ sekolah }} className={ctaClass}>Tinjau angsuran →</Link>}
        />
        <WorklistCard
          title="Laporan PPATK Tertunda"
          value={capLabel(ppatkTotal, CAP)}
          attention={ppatkTotal > 0}
          tone="warning"
          icon={<IconFile />}
          loading={ppatkQ.isLoading}
          isError={ppatkQ.isError}
          hint={ppatkHint}
          zeroLabel="Tidak ada laporan PPATK menggantung"
          action={<Link to="/kop/$sekolah/ppatk" params={{ sekolah }} className={ctaClass}>Buka laporan PPATK →</Link>}
        />
        <WorklistCard
          title="Rekening Dormant"
          value={capLabel(dormantCount, CAP)}
          attention={dormantCount > 0}
          tone="warning"
          icon={<IconWallet />}
          loading={dormantQ.isLoading}
          hint="Perlu aktivasi atau tindak lanjut"
          zeroLabel="Tidak ada rekening dormant"
          action={<Link to="/kop/$sekolah/rekening" params={{ sekolah }} className={ctaClass}>Kelola rekening →</Link>}
        />
        <WorklistCard
          title="Pipeline Calon Anggota"
          value={capLabel(pipelineCount, CAP)}
          attention={pipelineCount > 0}
          tone="neutral"
          icon={<IconUsers />}
          loading={pipelineQ.isLoading}
          hint="Calon anggota menunggu penyelesaian onboarding"
          zeroLabel="Tidak ada calon anggota tertunda"
          action={<Link to="/kop/$sekolah/onboarding" params={{ sekolah }} className={ctaClass}>Lanjutkan onboarding →</Link>}
        />
        <WorklistCard
          title="Transaksi Hari Ini"
          value={capLabel(txTotal, 9999)}
          attention={false}
          loading={txTodayQ.isLoading}
          isError={txTodayQ.isError}
          zeroLabel={txTodayQ.isError ? "—" : txHint}
          icon={<IconChart />}
          action={<Link to="/kop/$sekolah/transaksi" params={{ sekolah }} className={ctaClass}>Lihat transaksi →</Link>}
        />
      </div>
    </SectionCard>
  );
}
