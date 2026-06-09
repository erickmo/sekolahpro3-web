/**
 * PanelKepsek — the headmaster's zero-click communication-oversight cockpit (the Pesan
 * index surface for primary role `kepsek`).
 *
 * Driven entirely by REAL data: the existing "Contact Inbox SekolahPro" rows fed through
 * the pure deriveCommHealth (lib/pesanSla). Three signal cards + a one-sentence verdict
 * answer "apakah komunikasi sekolah sehat hari ini?", and an attention list surfaces the
 * overdue-SLA inbound.
 *
 * The official-broadcast + approval Meja depend on the not-yet-shipped `Pesan Broadcast`
 * doctype (separate Frappe repo), so that surface is rendered as an honest disabled seam
 * ("menunggu aktivasi server") rather than faking a send — see the Kepsek tournament plan.
 */
import { useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  IconAlert,
  IconClock,
  IconCheck,
  IconChat,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import {
  INBOX_DOCTYPE,
  computeInboxStats,
  formatWaktu,
  stripHtml,
  type InboxRow,
} from "../../lib/pesan/inbox";
import { deriveCommHealth, DEFAULT_SLA_JAM, type CommVerdict } from "../../lib/pesanSla";
import { useCommHealth } from "../../lib/pesan/pesanApi";
import { KomposerPengumuman } from "./KomposerPengumuman";
import { MejaPersetujuanPesan } from "./MejaPersetujuanPesan";

const INBOX_FIELDS = ["name", "nama", "email", "pesan", "status", "submitted_at", "creation"];
const INBOX_LIMIT = 200;
const STATUS_BARU = "Baru";
const OVERDUE_PREVIEW = 8;
const MS_PER_HOUR = 3600_000;

/** Verdict → headline copy + Badge tone. */
const VERDICT_META: Record<CommVerdict, { label: string; tone: "success" | "warning" | "danger" }> = {
  SEHAT: { label: "Komunikasi sekolah SEHAT hari ini", tone: "success" },
  "PERLU PERHATIAN": { label: "Komunikasi sekolah PERLU PERHATIAN", tone: "warning" },
  TERLAMBAT: { label: "Ada pesan yang TERLAMBAT direspon", tone: "danger" },
};

/** Whole-hour age of a row vs now (0 when no parseable timestamp). */
function ageJam(row: InboxRow, nowMs: number): number {
  const iso = row.submitted_at ?? row.creation;
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((nowMs - t) / MS_PER_HOUR));
}

export function PanelKepsek() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const listQuery = useResourceList<InboxRow>(INBOX_DOCTYPE, {
    fields: INBOX_FIELDS,
    order_by: "creation desc",
    limit_page_length: INBOX_LIMIT,
  });

  const items = useMemo<InboxRow[]>(() => listQuery.data ?? [], [listQuery.data]);
  const nowMs = Date.now();

  // Prefer the server's full-inbox signals (BE pesan_comm_health); fall back to the
  // client estimate over loaded rows while loading / on error so the panel never blanks.
  const healthQuery = useCommHealth(sekolah);
  const health = useMemo(
    () => healthQuery.data ?? deriveCommHealth(items, DEFAULT_SLA_JAM, nowMs),
    [healthQuery.data, items, nowMs],
  );
  const stats = useMemo(() => computeInboxStats(items), [items]);

  // Oldest-waiting unanswered first — what the headmaster wants to delegate.
  const overdue = useMemo(
    () =>
      items
        .filter((p) => p.status === STATUS_BARU)
        .map((p) => ({ row: p, age: ageJam(p, nowMs) }))
        .filter((x) => x.age > DEFAULT_SLA_JAM)
        .sort((a, b) => b.age - a.age)
        .slice(0, OVERDUE_PREVIEW),
    [items, nowMs],
  );

  const verdict = VERDICT_META[health.verdict];
  const [showCompose, setShowCompose] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pengawasan Komunikasi"
        title="Panel Kepala Sekolah"
        description="Pantau kesehatan komunikasi sekolah dalam sekali lihat. Anda mengawasi, bukan membalas."
      />

      <SectionCard>
        <div className="flex items-center gap-3">
          <Badge tone={verdict.tone} dot>
            {health.verdict}
          </Badge>
          <p className="text-base font-semibold text-fg">{verdict.label}</p>
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Belum Dibalas"
          value={health.belumDibalas.toLocaleString("id-ID")}
          icon={<IconAlert />}
          accent={health.belumDibalas > 0 ? "rose" : "emerald"}
          hint="pesan masuk menunggu respon"
        />
        <StatCard
          label="Terlama Menunggu"
          value={health.terlamaMenungguJam > 0 ? `${health.terlamaMenungguJam} jam` : "—"}
          icon={<IconClock />}
          accent={health.terlamaMenungguJam > DEFAULT_SLA_JAM ? "rose" : "amber"}
          hint="usia pesan tertua yang belum dibalas"
        />
        <StatCard
          label={`Lewat SLA (${DEFAULT_SLA_JAM} jam)`}
          value={health.lewatSla.toLocaleString("id-ID")}
          icon={<IconCheck />}
          accent={health.lewatSla > 0 ? "rose" : "emerald"}
          hint="melebihi batas waktu respon"
        />
      </div>

      <SectionCard
        title="Perlu Ditindaklanjuti"
        description="Pesan masuk yang sudah melewati batas SLA — delegasikan ke staf untuk ditangani."
      >
        {listQuery.isLoading ? (
          <p className="p-4 text-sm text-muted-fg">Memuat...</p>
        ) : overdue.length === 0 ? (
          <EmptyState
            title="Tidak ada yang terlambat"
            description="Semua pesan masuk masih dalam batas waktu respon."
          />
        ) : (
          <ul className="divide-y divide-border">
            {overdue.map(({ row, age }) => (
              <li key={row.name} className="flex items-start gap-3 py-3">
                <span className="h-4 w-4 mt-0.5 text-rose-500 shrink-0"><IconChat /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-fg text-sm truncate">{row.nama}</span>
                    <Badge tone="danger" dot>{age} jam</Badge>
                  </div>
                  <p className="text-xs text-muted-fg truncate">
                    {stripHtml(row.pesan ?? "") || row.email || "—"}
                  </p>
                  <p className="text-[10px] text-muted-fg tabular-nums mt-0.5">
                    Masuk {formatWaktu(row.submitted_at ?? row.creation)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Pengumuman Resmi"
        description="Broadcast resmi atas nama Kepala Sekolah ke seluruh wali."
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-fg">
            Susun pengumuman lalu ajukan; pengiriman menunggu persetujuan di bawah.
            Total {stats.total.toLocaleString("id-ID")} pesan masuk terpantau.
          </p>
          <Button onClick={() => setShowCompose(true)}>Buat Pengumuman</Button>
        </div>
      </SectionCard>

      <MejaPersetujuanPesan />

      <KomposerPengumuman open={showCompose} sekolah={sekolah} onClose={() => setShowCompose(false)} />
    </div>
  );
}
