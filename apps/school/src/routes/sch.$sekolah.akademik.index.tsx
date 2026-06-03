// Akademik TA hub — period-first entry point. Lists Tahun Ajaran (berjalan +
// arsip) so the user starts by picking a year; opening one enters its workspace
// (/akademik/$ta). Returning users with a remembered TA are auto-redirected into
// it (unless ?pick forces the picker). Data scoping is unchanged — this is IA only.
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import {
  Badge,
  Button,
  PageHeader,
  SectionCard,
  SetupBanner,
  Skeleton,
  IconCheck,
  IconClock,
  cn,
} from "@sekolahpro/ui";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { readStoredPeriode } from "../lib/akademikPeriode";
import { pickAutoRedirectTa, splitTaList, taPath } from "../lib/akademikNav";

type TaRow = {
  name: string;
  nama?: string;
  is_current?: 0 | 1;
  status?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
};

const TA_FIELDS = ["name", "nama", "is_current", "status", "tanggal_mulai", "tanggal_selesai"];

export interface HubSearch {
  /** When set (1), suppress the auto-redirect so the user can pick a TA. */
  pick?: number;
}

const HUB_GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Pilih Tahun Ajaran",
    detail: "Mulai dari kartu Tahun Ajaran berjalan untuk kerja harian, atau buka Arsip untuk tahun-tahun lampau.",
    roles: ["admin", "guru", "kepala"],
  },
  {
    title: "Masuk ruang kerja TA",
    detail: "Setiap Tahun Ajaran punya submenu yang sama: Dashboard, Input Nilai Test, Entri Nilai, dan Raport.",
    roles: ["guru", "admin"],
  },
  {
    title: "Arsip untuk audit & cetak ulang",
    detail: "Tahun Ajaran lampau dibuka read-only — aman untuk meninjau nilai lama atau mencetak ulang raport.",
    roles: ["kepala", "admin"],
  },
];

const HUB_GUIDE_TIPS = [
  "Tahun Ajaran terakhir yang Anda buka dibuka otomatis saat masuk modul Akademik.",
  "Tahun Ajaran aktif (berjalan) diatur di Master Data.",
];

/** Status descriptor for a TA card badge (label + tone + icon). */
function taStatus(ta: TaRow): { label: string; tone: "success" | "warning" | "neutral"; current: boolean } {
  if (ta.is_current) return { label: "Berjalan", tone: "success", current: true };
  if (ta.status && ta.status !== "Aktif") return { label: ta.status, tone: "warning", current: false };
  return { label: "Aktif", tone: "neutral", current: false };
}

/** A single TA card with an "Buka" action into its workspace. */
function TaCard({ sekolah, ta, primary }: { sekolah: string; ta: TaRow; primary?: boolean }) {
  const status = taStatus(ta);
  const Icon = status.current ? IconCheck : IconClock;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border p-4",
        primary ? "border-brand bg-brand/5 shadow-sm" : "border-border bg-bg",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-fg">{ta.nama ?? ta.name}</span>
          <Badge tone={status.tone} className="gap-1">
            <Icon className="h-3 w-3 shrink-0" aria-hidden />
            {status.label}
          </Badge>
        </div>
        {ta.tanggal_mulai ? (
          <p className="mt-0.5 text-xs text-muted-fg tabular-nums">
            {ta.tanggal_mulai} – {ta.tanggal_selesai ?? "…"}
          </p>
        ) : null}
      </div>
      <Link to="/sch/$sekolah/akademik/$ta" params={{ sekolah, ta: taPath(ta.name) }} className="shrink-0">
        <Button variant={primary ? "default" : "outline"}>Buka</Button>
      </Link>
    </div>
  );
}

function AkademikHubPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const search = useSearch({ from: "/sch/$sekolah/akademik/" });
  const navigate = useNavigate({ from: "/sch/$sekolah/akademik/" });
  const [showArsip, setShowArsip] = useState(false);

  const taQ = useResourceList<TaRow>("Tahun Ajaran", {
    fields: TA_FIELDS,
    order_by: "`tanggal_mulai` desc",
    limit_page_length: 0,
  });
  const taList = useMemo(() => taQ.data ?? [], [taQ.data]);
  const { berjalan, arsip } = useMemo(() => splitTaList(taList), [taList]);

  // Auto-redirect into the last-opened TA unless the user explicitly asked to pick
  // (?pick) or there is no valid stored TA — keeping the hub the entry only when
  // there is no remembered period to jump straight into.
  useEffect(() => {
    if (search.pick) return;
    if (taList.length === 0) return;
    const target = pickAutoRedirectTa(readStoredPeriode(sekolah).ta, taList);
    if (target) {
      navigate({
        to: "/sch/$sekolah/akademik/$ta",
        params: { sekolah, ta: taPath(target) },
        replace: true,
      });
    }
  }, [search.pick, taList, sekolah, navigate]);

  if (taQ.isLoading) return <Skeleton className="h-48 w-full" />;

  // When there is no running TA, surface the newest one as the primary card so the
  // user is never stuck (fallback per spec); the rest stay under Arsip.
  const fallback = berjalan.length === 0 && arsip.length > 0 ? arsip[0] : null;
  const featured: TaRow[] = berjalan.length > 0 ? berjalan : fallback ? [fallback] : [];
  const archiveRest = berjalan.length > 0 ? arsip : arsip.slice(1);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik"
        title="Tahun Ajaran"
        description="Mulai dari memilih Tahun Ajaran. Setiap tahun punya submenu yang sama: Dashboard, Input Nilai Test, Entri Nilai, dan Raport."
      />

      <PageGuide
        storageId="akademik-hub"
        title="Cara pakai halaman ini"
        intro="Pilih Tahun Ajaran berjalan untuk kerja harian, atau buka Arsip untuk tahun lampau."
        steps={HUB_GUIDE_STEPS}
        tips={HUB_GUIDE_TIPS}
      />

      {taList.length === 0 ? (
        <SectionCard title="Belum ada Tahun Ajaran">
          <SetupBanner
            tone="info"
            title="Tambahkan Tahun Ajaran di Master Data"
            description="Modul Akademik bekerja per Tahun Ajaran. Buat Tahun Ajaran terlebih dahulu agar bisa dibuka di sini."
          />
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Tahun Ajaran Berjalan"
            description={
              berjalan.length > 0
                ? "Periode aktif untuk kerja harian."
                : "Belum ada TA berjalan — menampilkan yang terbaru."
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {featured.map((ta) => (
                <TaCard key={ta.name} sekolah={sekolah} ta={ta} primary />
              ))}
            </div>
          </SectionCard>

          {archiveRest.length > 0 ? (
            <SectionCard
              title="Arsip"
              description="Tahun Ajaran lampau / ditutup. Dibuka read-only untuk audit & cetak ulang."
              action={
                <Button variant="ghost" onClick={() => setShowArsip((v) => !v)}>
                  {showArsip ? "Sembunyikan" : `Tampilkan (${archiveRest.length})`}
                </Button>
              }
            >
              {showArsip ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {archiveRest.map((ta) => (
                    <TaCard key={ta.name} sekolah={sekolah} ta={ta} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-fg">
                  {archiveRest.length} Tahun Ajaran arsip. Klik “Tampilkan” untuk membuka daftar.
                </p>
              )}
            </SectionCard>
          ) : null}
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/")({
  component: AkademikHubPage,
  validateSearch: (search: Record<string, unknown>): HubSearch => {
    const out: HubSearch = {};
    if (search.pick) out.pick = 1;
    return out;
  },
});
