// Akademik TA hub — period-first entry point. Lists Tahun Ajaran (berjalan +
// arsip) so the user starts by picking a year; opening one enters its workspace
// (/akademik/$ta). Returning users with a remembered TA are auto-redirected into
// it (unless ?pick forces the picker). Data scoping is unchanged — this is IA only.
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useResourceList } from "@sekolahpro/api-client";
import { Button, PageHeader, SectionCard, SetupBanner, Skeleton } from "@sekolahpro/ui";
import { PageGuide, type PageGuideStep } from "../components/guide";
import {
  PpdbHubCard,
  TaCard,
  workspaceGoHref,
  type HubTaRow,
} from "../components/akademik/HubCards";
import { readStoredPeriode } from "../lib/akademikPeriode";
import { parseGoParam, pickAutoRedirectTa, pickNextTa, splitTaList } from "../lib/akademikNav";

type PpdbRow = { name: string };

const TA_FIELDS = ["name", "nama", "is_current", "status", "tanggal_mulai", "tanggal_selesai"];

/** Local "today" as YYYY-MM-DD. Mirrors akademikPeriode's local-date convention
 * (never toISOString → that is UTC and skews +7h in Asia/Jakarta). */
function todayLocalStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface HubSearch {
  /** When set (1), suppress the auto-redirect so the user can pick a TA. */
  pick?: number;
  /** Legacy-URL stub target: workspace module subpath to forward to after TA
   * resolution (e.g. "kelas", "jadwal/papan"). Validated by parseGoParam in
   * the hub component before use (consumed in plan Task 7). */
  go?: string;
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

export function AkademikHubPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const search = useSearch({ from: "/sch/$sekolah/akademik/" });
  const navigate = useNavigate({ from: "/sch/$sekolah/akademik/" });
  const [showArsip, setShowArsip] = useState(false);

  // Validated legacy-stub forward target (e.g. "kelas/rombel"); null when absent
  // or unsafe. Drives both the auto-redirect and the TA pick links below.
  const go = parseGoParam(search.go);

  const taQ = useResourceList<HubTaRow>("Tahun Ajaran", {
    fields: TA_FIELDS,
    order_by: "`tanggal_mulai` desc",
    limit_page_length: 0,
  });
  const taList = useMemo(() => taQ.data ?? [], [taQ.data]);
  const { berjalan, arsip } = useMemo(() => splitTaList(taList), [taList]);

  // Nearest TA starting after today → next-year PPDB card. Compared as a local
  // date string (Asia/Jakarta), never via UTC toISOString.
  const nextTa = useMemo(() => pickNextTa(taList, todayLocalStr(new Date())), [taList]);
  // Only count applicants once we know which year to scope to; disabled when
  // there is no upcoming TA so the card shows no (false) zero.
  const ppdbQ = useResourceList<PpdbRow>(
    "Pendaftaran PPDB",
    { filters: { tahun_ajaran: nextTa?.name ?? "" }, fields: ["name"], limit_page_length: 0 },
    { enabled: !!nextTa },
  );
  const ppdbCount = ppdbQ.data?.length ?? 0;

  // Auto-redirect into the last-opened TA unless the user explicitly asked to pick
  // (?pick) or there is no valid stored TA — keeping the hub the entry only when
  // there is no remembered period to jump straight into. When a legacy stub asked
  // to forward (`go`), land on the module subpath via the href escape hatch
  // (a typed `to` cannot template an arbitrary child path).
  useEffect(() => {
    if (search.pick) return;
    if (taList.length === 0) return;
    const target = pickAutoRedirectTa(readStoredPeriode(sekolah).ta, taList, new Date());
    if (!target) return;
    if (go) {
      navigate({ href: workspaceGoHref(sekolah, target, go), replace: true });
    } else {
      navigate({
        // RAW name — the router encodes the segment once; taPath here would
        // double-encode and a TA name with "/" never matches → picker bounce.
        to: "/sch/$sekolah/akademik/$ta",
        params: { sekolah, ta: target },
        replace: true,
      });
    }
  }, [search.pick, taList, sekolah, navigate, go]);

  if (taQ.isLoading) return <Skeleton className="h-48 w-full" />;

  // When there is no running TA, surface the newest one as the primary card so the
  // user is never stuck (fallback per spec); the rest stay under Arsip.
  const fallback = berjalan.length === 0 && arsip.length > 0 ? arsip[0] : null;
  const featured: HubTaRow[] = berjalan.length > 0 ? berjalan : fallback ? [fallback] : [];
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
                <TaCard key={ta.name} sekolah={sekolah} ta={ta} primary go={go} navigate={navigate} />
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {/* Always-visible pointer to next-year admission. The hub only shows
          "Berjalan + Arsip", which silently denies that a future year exists;
          beginners searching for "tahun depan" must find it here, not phone TU
          (debate critic must-fix #5). PPDB is intentionally a separate module. */}
      <SectionCard
        title="Tahun Depan"
        description={
          nextTa
            ? `Penerimaan murid baru untuk Tahun Ajaran ${nextTa.nama ?? nextTa.name} dikelola di modul PPDB.`
            : "Penerimaan murid baru untuk tahun ajaran berikutnya dikelola di modul PPDB."
        }
      >
        <PpdbHubCard sekolah={sekolah} nextTa={nextTa} count={ppdbCount} />
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
                <TaCard key={ta.name} sekolah={sekolah} ta={ta} go={go} navigate={navigate} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-fg">
              {archiveRest.length} Tahun Ajaran arsip. Klik “Tampilkan” untuk membuka daftar.
            </p>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/")({
  component: AkademikHubPage,
  validateSearch: (search: Record<string, unknown>): HubSearch => {
    const out: HubSearch = {};
    if (search.pick) out.pick = 1;
    // Pass the go param through as a raw string; the hub component validates
    // it via parseGoParam before navigating (task 7).
    if (typeof search.go === "string" && search.go) out.go = search.go;
    return out;
  },
});
