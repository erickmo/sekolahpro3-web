/**
 * Anggota Perpustakaan detail page.
 *
 * Renders member info + workflow actions, plus a cross-context "Peminjaman
 * Aktif" section that surfaces in-flight loans (Aktif/Terlambat) with a
 * one-click `Kembalikan` trigger to ReturnModal. See PERP-ADR-0001 and
 * docs/superpowers/specs/2026-05-25-perpustakaan-sirkulasi-merge-design.md.
 */
import { useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@sekolahpro/ui";
import { useResourceDoc, useResourceList, updateResource } from "@sekolahpro/api-client";
import { PerpDetailScaffold } from "../components/perpustakaan/PerpDetailScaffold";
import { perpFormatRupiah } from "../components/perpustakaan/perpFormatters";
import { ReturnModal } from "../components/perpustakaan/ReturnModal";

const DOCTYPE = "Anggota Perpustakaan";
const PEMINJAMAN_DOCTYPE = "Peminjaman Buku";
const ACTIVE_STATUSES = ["Aktif", "Terlambat"] as const;
const ACTIVE_LIMIT = 50;

type PeminjamanAktif = {
  name: string;
  tanggal_kembali_rencana?: string;
  status: string;
};

interface PeminjamanAktifSectionProps {
  items: PeminjamanAktif[];
  onReturn: (name: string) => void;
}

function PeminjamanAktifSection({ items, onReturn }: PeminjamanAktifSectionProps) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold mb-2">Peminjaman Aktif ({items.length})</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada peminjaman aktif</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((p) => (
            <li key={p.name} className="py-2 flex items-center justify-between">
              <span className="font-mono text-xs">
                {p.name} — rencana {p.tanggal_kembali_rencana ?? "—"} ({p.status})
              </span>
              <Button size="sm" onClick={() => onReturn(p.name)}>Kembalikan</Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type Doc = {
  name: string;
  nama_lengkap?: string;
  tipe_anggota?: string;
  nis_nip?: string;
  kelas?: string;
  status?: string;
  saldo_denda?: number;
  email?: string;
  no_hp?: string;
  tanggal_daftar?: string;
  catatan?: string;
};

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "brand" | "danger"> = {
  Aktif: "success",
  Dibekukan: "warning",
  Lulus: "neutral",
  Keluar: "neutral",
};

function AnggotaDetailPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const { name } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useResourceDoc<Doc>(DOCTYPE, name);
  const doc = data;
  const status = doc?.status;
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const { data: aktif = [] } = useResourceList<PeminjamanAktif>(PEMINJAMAN_DOCTYPE, {
    filters: [["anggota", "=", name], ["status", "in", [...ACTIVE_STATUSES]]],
    fields: ["name", "tanggal_kembali_rencana", "status"],
    limit_page_length: ACTIVE_LIMIT,
  });

  const workflowMut = useMutation<Doc, Error, Record<string, unknown>>({
    mutationFn: (patch) => updateResource<Doc>(DOCTYPE, name, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resource:doc", DOCTYPE, name] });
      qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
    },
  });

  const handleBekukan = () => {
    if (!confirm("Bekukan keanggotaan ini? Anggota tidak dapat meminjam.")) return;
    workflowMut.mutate({ status: "Dibekukan" });
  };
  const handleAktifkan = () => {
    if (!confirm("Aktifkan kembali keanggotaan ini?")) return;
    workflowMut.mutate({ status: "Aktif" });
  };

  return (
    <>
    <PerpDetailScaffold
      eyebrow="Anggota Perpustakaan"
      title={doc?.nama_lengkap ?? name}
      backTo="/sch/$sekolah/perpustakaan/anggota"
      crumbParent={{ label: "Anggota", to: "/sch/$sekolah/perpustakaan/anggota" }}
      crumbSelf={doc?.nama_lengkap ?? name}
      description={doc?.tipe_anggota ? `${doc.tipe_anggota}${doc.kelas ? ` · ${doc.kelas}` : ""}` : undefined}
      status={status ? { label: status, tone: STATUS_TONE[status] ?? "neutral" } : undefined}
      loading={isLoading}
      errorMessage={error ? (error as Error).message : undefined}
      primaryInfo={[
        { label: "ID Anggota", value: <span className="font-mono text-xs">{doc?.name ?? name}</span> },
        { label: "Nama Lengkap", value: doc?.nama_lengkap ?? "—" },
        { label: "Tipe", value: doc?.tipe_anggota ?? "—" },
        { label: "NIS/NIP", value: doc?.nis_nip ?? "—" },
        { label: "Kelas", value: doc?.kelas ?? "—" },
        { label: "Email", value: doc?.email ?? "—" },
        { label: "No HP", value: doc?.no_hp ?? "—" },
        { label: "Tgl Daftar", value: doc?.tanggal_daftar ?? "—" },
        { label: "Saldo Denda", value: <span className="tabular-nums">{perpFormatRupiah(doc?.saldo_denda)}</span> },
      ]}
      secondaryInfo={doc?.catatan ? [{ label: "Catatan", value: doc.catatan }] : undefined}
      actions={
        <>
          {status === "Aktif" ? (
            <Button size="sm" variant="destructive" onClick={handleBekukan} disabled={workflowMut.isPending}>Bekukan</Button>
          ) : null}
          {status === "Dibekukan" ? (
            <Button size="sm" onClick={handleAktifkan} disabled={workflowMut.isPending}>Aktifkan</Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/sch/$sekolah/perpustakaan/anggota", params: { sekolah } })}>Tutup</Button>
        </>
      }
      extraSections={<PeminjamanAktifSection items={aktif} onReturn={setReturnFor} />}
    />
    {returnFor && (
      <ReturnModal
        open
        peminjaman={returnFor}
        onClose={() => setReturnFor(null)}
        onSuccess={() => setReturnFor(null)}
      />
    )}
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/anggota/$name")({ component: AnggotaDetailPage });
