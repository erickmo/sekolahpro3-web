import { useState } from "react";
import { createFileRoute, Link, useParams} from "@tanstack/react-router";
import { Badge, Button, EmptyState, type Column } from "@sekolahpro/ui";
import { frappeFetch } from "@sekolahpro/api-client";
import { ResourceListPage } from "../components/ResourceListPage";
import { summarizeIjazah } from "../lib/orang/siswaListSummaries";

// Summary buckets archives by distribution status (Belum/Sudah Diambil/Dikirim).
const SUMMARY_FIELDS = ["name", "status_distribusi"];
// Styling for the EmptyState's primary link (mirrors the brand button look).
const PRIMARY_LINK_CLASS =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-5 bg-brand text-white hover:bg-brand/90";

type Row = {
  name: string;
  siswa: string;
  no_ijazah: string;
  no_skhun?: string;
  tahun_kelulusan: string;
  tanggal_terbit: string;
  retention_until: string;
  status_distribusi?: "Belum Diambil" | "Sudah Diambil" | "Dikirim";
};

const DOWNLOAD_REASONS = [
  "Permintaan Alumni",
  "Verifikasi Pihak Ketiga",
  "Audit Internal",
  "Permintaan Wali",
  "Lainnya",
];

const STATUS_TONE: Record<NonNullable<Row["status_distribusi"]>, "success" | "warning" | "neutral"> = {
  "Sudah Diambil": "success",
  Dikirim: "success",
  "Belum Diambil": "warning",
};

function yearsRemaining(retentionIso: string): number {
  const target = new Date(retentionIso);
  if (Number.isNaN(target.getTime())) return 0;
  const now = new Date();
  return (target.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

function RetentionBadge({ retention }: { retention: string }) {
  const remaining = yearsRemaining(retention);
  if (remaining < 0) return <Badge tone="danger" dot>Expired</Badge>;
  if (remaining < 2) return <Badge tone="danger" dot>{remaining.toFixed(1)} tahun</Badge>;
  if (remaining < 5) return <Badge tone="warning" dot>{remaining.toFixed(1)} tahun</Badge>;
  return <Badge tone="success" dot>{remaining.toFixed(1)} tahun</Badge>;
}

async function downloadIjazah(name: string, reason: string): Promise<void> {
  const data = await frappeFetch<{ url?: string }>(
    "sekolahpro.siswa.arsip_ijazah.download",
    { name, reason },
  );
  if (data?.url) {
    window.open(data.url, "_blank", "noopener");
  }
}

function DownloadButton({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handlePick(reason: string) {
    setBusy(true);
    setErr(null);
    try {
      await downloadIjazah(name, reason);
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Unduh
      </Button>
    );
  }

  return (
    <div className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-border bg-bg p-2 shadow-md">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-fg">Pilih alasan akses</div>
      <div className="flex flex-col gap-1">
        {DOWNLOAD_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            disabled={busy}
            onClick={() => void handlePick(r)}
            className="rounded px-2 py-1 text-left text-xs hover:bg-muted disabled:opacity-50"
          >
            {r}
          </button>
        ))}
      </div>
      {err ? <div className="mt-1 text-[10px] text-danger">{err}</div> : null}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-1 w-full rounded px-2 py-1 text-[10px] text-muted-fg hover:bg-muted"
      >
        Batal
      </button>
    </div>
  );
}

const COLUMNS: Column<Row>[] = [
  {
    key: "name",
    header: "ID Arsip",
    sortable: true,
    cell: (r) => <span className="font-mono text-xs">{r.name}</span>,
  },
  { key: "siswa", header: "Siswa", sortable: true, cell: (r) => r.siswa },
  {
    key: "no_ijazah",
    header: "No. Ijazah",
    cell: (r) => <span className="font-mono text-xs">{r.no_ijazah}</span>,
  },
  { key: "tahun_kelulusan", header: "TA", cell: (r) => r.tahun_kelulusan },
  { key: "tanggal_terbit", header: "Diterbitkan", sortable: true, cell: (r) => r.tanggal_terbit },
  {
    key: "retention_until",
    header: "Retensi",
    cell: (r) => <RetentionBadge retention={r.retention_until} />,
  },
  {
    key: "status_distribusi",
    header: "Distribusi",
    cell: (r) =>
      r.status_distribusi ? (
        <Badge tone={STATUS_TONE[r.status_distribusi]} dot>
          {r.status_distribusi}
        </Badge>
      ) : (
        "—"
      ),
  },
  {
    key: "_actions",
    header: "Aksi",
    cell: (r) => (
      <div className="relative">
        <DownloadButton name={r.name} />
      </div>
    ),
  },
];

function IjazahPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  return (
    <>
      <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800">
        UU PDP & Permendikbud — retensi 25 tahun. Setiap unduh wajib pilih alasan akses dan akan
        tercatat di audit log. Bulk download tidak diizinkan.{" "}
        <Link to="/sch/$sekolah/siswa/kelulusan" params={{ sekolah }} className="underline">
          Lihat Kelulusan
        </Link>{" "}
        sebagai sumber penerbitan.
      </div>
      <ResourceListPage<Row>
        eyebrow="Siswa"
        title="Arsip Ijazah"
        doctype="Arsip Ijazah"
        fields={[
          "name",
          "siswa",
          "no_ijazah",
          "no_skhun",
          "tahun_kelulusan",
          "tanggal_terbit",
          "retention_until",
          "status_distribusi",
        ]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        summarize={summarizeIjazah}
        summaryFields={SUMMARY_FIELDS}
        gettingStarted={
          <EmptyState
            title="Belum ada arsip ijazah"
            description="Arsip ijazah terbit dari proses kelulusan. Selesaikan kelulusan siswa terlebih dahulu."
            action={
              <Link to="/sch/$sekolah/siswa/kelulusan" params={{ sekolah }} className={PRIMARY_LINK_CLASS}>
                Buka Kelulusan
              </Link>
            }
          />
        }
        defaultSort={{ key: "tanggal_terbit", dir: "desc" }}
        searchFields={["name", "siswa", "no_ijazah"]}
        selectFilters={[
          {
            key: "tahun",
            label: "TA",
            field: "tahun_kelulusan",
            options: ["Semua", "2025/2026", "2024/2025", "2023/2024", "2022/2023"].map((v) => ({
              value: v,
              label: v,
            })),
          },
          {
            key: "distribusi",
            label: "Distribusi",
            field: "status_distribusi",
            options: ["Semua", "Belum Diambil", "Sudah Diambil", "Dikirim"].map((v) => ({
              value: v,
              label: v,
            })),
          },
        ]}
      />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/ijazah")({ component: IjazahPage });
