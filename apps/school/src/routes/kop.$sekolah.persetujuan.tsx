import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  PageHeader,
  RejectModal,
  SectionCard,
  SkeletonText,
  Tabs,
  type TabItem,
} from "@sekolahpro/ui";
import {
  useResourceList,
  useResourceUpdate,
} from "@sekolahpro/api-client";

/**
 * Approval Inbox — satu pintu masuk supervisor untuk seluruh permohonan
 * koperasi (5 jenis permohonan + pembiayaan). Audit UX 2026-05-26:
 * supervisor sebelumnya harus menjelajah Frappe desk per doctype.
 *
 * Lifecycle umum (per docs/domains/koperasi/entities/permohonan-*.html):
 *   Draft → Diajukan → Disetujui / Ditolak
 * Field `alasan_penolakan` wajib bila status=Ditolak.
 */

interface PermohonanType {
  key: string;
  label: string;
  doctype: string;
  /** Field-field tambahan untuk subtitle baris. */
  subtitleFields: string[];
  /** Renderer subtitle (alasan permohonan singkat). */
  renderSubtitle: (row: PermohonanRow) => string;
}

interface PermohonanRow {
  name: string;
  status_permohonan?: string;
  nasabah?: string;
  tanggal_diajukan?: string;
  produk_simpanan?: string;
  rekening?: string;
  alasan?: string;
}

const TYPES: PermohonanType[] = [
  {
    key: "buka",
    label: "Buka Rekening",
    doctype: "Permohonan Buka Rekening",
    subtitleFields: ["produk_simpanan"],
    renderSubtitle: (r) => `Produk: ${r.produk_simpanan ?? "—"}`,
  },
  {
    key: "tutup",
    label: "Tutup Rekening",
    doctype: "Permohonan Tutup Rekening",
    subtitleFields: ["rekening", "alasan"],
    renderSubtitle: (r) => `Rekening: ${r.rekening ?? "—"} · ${r.alasan ?? "tanpa alasan"}`,
  },
  {
    key: "blokir",
    label: "Blokir",
    doctype: "Permohonan Blokir Rekening",
    subtitleFields: ["rekening", "alasan"],
    renderSubtitle: (r) => `Rekening: ${r.rekening ?? "—"} · ${r.alasan ?? "—"}`,
  },
  {
    key: "unblokir",
    label: "Unblokir",
    doctype: "Permohonan Unblokir Rekening",
    subtitleFields: ["rekening", "alasan"],
    renderSubtitle: (r) => `Rekening: ${r.rekening ?? "—"} · ${r.alasan ?? "—"}`,
  },
  {
    key: "dormant",
    label: "Aktivasi Dormant",
    doctype: "Permohonan Aktivasi Dormant",
    subtitleFields: ["rekening"],
    renderSubtitle: (r) => `Rekening: ${r.rekening ?? "—"}`,
  },
];

function PersetujuanPage() {
  const [activeKey, setActiveKey] = useState<string>(TYPES[0]!.key);
  const activeType = TYPES.find((t) => t.key === activeKey) ?? TYPES[0]!;

  // Hitung badge count per jenis — query paralel via useResourceList.
  // Setiap query mandiri (Tanstack Query); hindari N+1 dengan cap fields ringan.
  // TYPES is a module-level constant so hook order stays stable.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const countQueries = TYPES.map((t) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useResourceList<{ name: string }>(t.doctype, {
      fields: ["name"],
      filters: [["status_permohonan", "=", "Diajukan"]],
      limit_page_length: 100,
    }),
  );

  const tabs: TabItem[] = TYPES.map((t, i) => {
    const count = countQueries[i]?.data?.length ?? 0;
    return {
      key: t.key,
      label: t.label,
      count: count > 0 ? count : undefined,
      active: activeKey === t.key,
      render: ({ className, children }) => (
        <button type="button" className={className} onClick={() => setActiveKey(t.key)}>
          {children}
        </button>
      ),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Koperasi"
        title="Persetujuan Permohonan"
        description="Antrian permohonan menunggu keputusan supervisor."
      />
      <KoperasiPageGuide id="persetujuan" />
      <Tabs items={tabs} />
      <PermohonanList type={activeType} />
    </div>
  );
}

function PermohonanList({ type }: { type: PermohonanType }) {
  const q = useResourceList<PermohonanRow>(type.doctype, {
    fields: ["name", "status_permohonan", "nasabah", "tanggal_diajukan", ...type.subtitleFields],
    filters: [["status_permohonan", "=", "Diajukan"]],
    order_by: "tanggal_diajukan asc",
    limit_page_length: 50,
  });

  const updateMut = useResourceUpdate(type.doctype);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [busyName, setBusyName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => q.data ?? [], [q.data]);

  const handleApprove = (name: string) => {
    setBusyName(name);
    setError(null);
    updateMut.mutate(
      { name, patch: { status_permohonan: "Disetujui" } },
      {
        onSuccess: () => {
          setBusyName(null);
          void q.refetch();
        },
        onError: (e) => {
          setBusyName(null);
          setError(e.message);
        },
      },
    );
  };

  const handleReject = (name: string, alasan: string) => {
    setBusyName(name);
    setError(null);
    updateMut.mutate(
      {
        name,
        patch: { status_permohonan: "Ditolak", alasan_penolakan: alasan },
      },
      {
        onSuccess: () => {
          setBusyName(null);
          setRejectFor(null);
          void q.refetch();
        },
        onError: (e) => {
          setBusyName(null);
          setError(e.message);
        },
      },
    );
  };

  return (
    <SectionCard
      title={`${rows.length} permohonan menunggu`}
      description={`Jenis: ${type.label}`}
    >
      {error ? (
        <Alert tone="danger" className="mb-3" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {q.isLoading ? (
        <SkeletonText lines={6} aria-label="Memuat permohonan" />
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-fg">
          Tidak ada permohonan menunggu untuk {type.label.toLowerCase()}.
        </div>
      ) : (
        <ul className="divide-y divide-border -my-2">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-3 py-3">
              <Avatar name={r.nasabah ?? r.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-fg truncate">
                    {r.nasabah ?? "(tanpa nasabah)"}
                  </span>
                  <Badge tone="warning" dot>
                    Diajukan
                  </Badge>
                </div>
                <div className="text-xs text-muted-fg truncate">
                  {r.name} · {r.tanggal_diajukan ?? "—"} · {type.renderSubtitle(r)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyName === r.name}
                  onClick={() => setRejectFor(r.name)}
                >
                  Tolak
                </Button>
                <Button
                  size="sm"
                  disabled={busyName === r.name}
                  onClick={() => handleApprove(r.name)}
                >
                  {busyName === r.name ? "..." : "Setujui"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {rejectFor ? (
        <RejectModal
          open
          onClose={() => setRejectFor(null)}
          onSubmit={(reason) => handleReject(rejectFor, reason)}
          entityName={`Permohonan ${type.label}`}
          pending={busyName === rejectFor}
        />
      ) : null}
    </SectionCard>
  );
}

export const Route = createFileRoute("/kop/$sekolah/persetujuan")({
  component: PersetujuanPage,
});
