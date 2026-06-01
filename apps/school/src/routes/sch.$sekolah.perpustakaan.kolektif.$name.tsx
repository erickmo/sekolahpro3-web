/**
 * Pinjam Kolektif Kelas — detail / create.
 *
 * Bulk-add eksemplar via paste newline-delimited (per UX rec).
 * Pengembalian kolektif sebagai counter-transaction terpisah (button "Kembalikan Kolektif").
 * Lihat PERP-ADR-0007.
 *
 * Layer: route. Owns fetch + mutations (insertAndSubmit) + compose. Presentational
 * pieces live in KolektifMemberPanel / KolektifItemsTable; pure scan/dedup logic
 * in kolektifCompute.
 */
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  IconCheck,
  PageHeader,
  SectionCard,
  Textarea,
} from "@sekolahpro/ui";
import {
  getResource,
  listResource,
  updateResource,
} from "@sekolahpro/api-client";
import { perpToday } from "../components/perpustakaan/perpFormatters";
import { insertAndSubmit } from "../components/perpustakaan/circulation";
import {
  parseScanCodes,
  isDuplicateItem,
  resolveItem,
  bulkAdd,
  type ItemRow,
  type EksemplarRow,
} from "../components/perpustakaan/kolektifCompute";
import { KolektifMemberPanel } from "../components/perpustakaan/KolektifMemberPanel";
import { KolektifItemsTable } from "../components/perpustakaan/KolektifItemsTable";
import { KolektifReturnModal } from "../components/perpustakaan/KolektifReturnModal";

/** Class-loan window in days (longer than the individual terminal's 7). */
const KOLEKTIF_LOAN_DAYS = 14;
/** terminal_id stamped on records created from the web UI (not a kiosk). */
const TERMINAL_WEB = "WEB-UI";
/** Route param sentinel for an unsaved (new) record. */
const NEW_RECORD = "new";
/** Max number of per-code errors surfaced in the bulk-add summary. */
const ERROR_PREVIEW_MAX = 5;

type Header = {
  name?: string;
  guru_penanggung_jawab: string;
  rombongan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  status?: string;
  tujuan: string;
  terminal_id: string;
  catatan: string;
  items: ItemRow[];
  docstatus?: number;
};

function defaultHeader(): Header {
  const today = perpToday();
  const plus14 = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() + KOLEKTIF_LOAN_DAYS);
    return d.toISOString().slice(0, 10);
  })();
  return {
    guru_penanggung_jawab: "",
    rombongan: "",
    tanggal_pinjam: today,
    tanggal_kembali_rencana: plus14,
    status: "Aktif",
    tujuan: "",
    terminal_id: TERMINAL_WEB,
    catatan: "",
    items: [],
  };
}

/** Look up one eksemplar by id or nomor_inventaris (I/O for the bulk add). */
async function lookupEksemplar(code: string): Promise<EksemplarRow | undefined> {
  const rows = await listResource<EksemplarRow>("Eksemplar Buku", {
    fields: ["name", "nomor_inventaris", "buku", "status"],
    or_filters: [["name", "=", code], ["nomor_inventaris", "=", code]] as [string, string, unknown][],
    limit_page_length: 1,
  });
  return rows[0];
}

function KolektifDetailPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const { name } = useParams({ from: "/sch/$sekolah/perpustakaan/kolektif/$name" });
  const navigate = useNavigate();
  const isNew = name === NEW_RECORD;

  const [doc, setDoc] = useState<Header>(() => defaultHeader());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [pengembalianOpen, setPengembalianOpen] = useState(false);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await getResource<Header & { items?: ItemRow[] }>("Pinjam Kolektif Kelas", name);
        if (!cancelled) setDoc({ ...defaultHeader(), ...d, items: d.items ?? [] });
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Gagal memuat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isNew, name]);

  const isReadonly = (doc.docstatus ?? 0) >= 1 || doc.status === "Selesai" || doc.status === "Batal";

  const patchHeader = (patch: Partial<Header>) => setDoc((p) => ({ ...p, ...patch }));

  const handleBulkAdd = async () => {
    const codes = parseScanCodes(bulkInput);
    if (codes.length === 0) return;
    setBulkBusy(true);
    setErr(null);
    let added: ItemRow[] = [];
    const errors: string[] = [];
    for (const c of codes) {
      if (isDuplicateItem(doc.items, c)) {
        errors.push(`${c}: duplikat`);
        continue;
      }
      const r = resolveItem(c, await lookupEksemplar(c.trim()));
      if ("error" in r) errors.push(r.error);
      else added = bulkAdd(added, r);
    }
    setDoc((p) => ({ ...p, items: [...p.items, ...added] }));
    setBulkInput("");
    setBulkBusy(false);
    if (errors.length > 0) setErr(`${added.length} ditambah, ${errors.length} gagal: ${errors.slice(0, ERROR_PREVIEW_MAX).join("; ")}${errors.length > ERROR_PREVIEW_MAX ? "…" : ""}`);
  };

  const removeItem = (idx: number) =>
    setDoc((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const save = async () => {
    if (!doc.guru_penanggung_jawab) return setErr("Guru PJ wajib.");
    if (!doc.rombongan) return setErr("Rombel wajib.");
    if (doc.items.length === 0) return setErr("Minimal 1 eksemplar.");
    setErr(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        guru_penanggung_jawab: doc.guru_penanggung_jawab,
        rombongan: doc.rombongan,
        tanggal_pinjam: doc.tanggal_pinjam,
        tanggal_kembali_rencana: doc.tanggal_kembali_rencana,
        status: doc.status ?? "Aktif",
        tujuan: doc.tujuan,
        terminal_id: doc.terminal_id,
        catatan: doc.catatan,
        items: doc.items.map((it) => ({
          eksemplar: it.eksemplar,
          nomor_inventaris: it.nomor_inventaris ?? "",
          judul_buku: it.judul_buku ?? "",
        })),
      };
      let savedName = name;
      if (isNew) {
        // Finalize on save via insert→submit so the loan's on_submit checkout
        // side-effects run and the "Tersubmit" state is reachable. PERP-GAP-26
        const c = await insertAndSubmit<{ name: string }>("Pinjam Kolektif Kelas", payload);
        savedName = c.name;
      } else {
        await updateResource("Pinjam Kolektif Kelas", name, payload);
      }
      navigate({ to: "/sch/$sekolah/perpustakaan/kolektif/$name", params: { sekolah, name: savedName } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => ({ totalEks: doc.items.length }), [doc.items.length]);

  if (loading) return <div className="p-6 text-sm text-muted-fg">Memuat...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Perpustakaan / Kolektif"
        title={isNew ? "Pinjam Kolektif Baru" : name}
        description={
          isReadonly
            ? `Status: ${doc.status ?? "—"}. Tidak dapat diedit.`
            : "Pilih guru PJ + rombel. Tambah eksemplar via paste atau picker."
        }
      />

      {err ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700">{err}</div>
      ) : null}

      <SectionCard title="Header Pinjam">
        <KolektifMemberPanel doc={doc} isReadonly={isReadonly} onPatch={patchHeader} />
      </SectionCard>

      <SectionCard
        title={`Eksemplar (${stats.totalEks})`}
        description="Paste kode/nomor inventaris (newline atau koma) untuk bulk add."
      >
        <KolektifItemsTable
          items={doc.items}
          isReadonly={isReadonly}
          bulkInput={bulkInput}
          bulkBusy={bulkBusy}
          onBulkInputChange={setBulkInput}
          onBulkAdd={handleBulkAdd}
          onRemove={removeItem}
        />
      </SectionCard>

      <SectionCard title="Catatan">
        <Textarea value={doc.catatan} disabled={isReadonly} rows={2}
          onChange={(e) => setDoc((p) => ({ ...p, catatan: e.target.value }))} />
      </SectionCard>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => navigate({ to: "/sch/$sekolah/perpustakaan/kolektif", params: { sekolah } })}>Kembali</Button>
        {!isReadonly ? (
          <Button onClick={save} disabled={saving}>
            <IconCheck className="mr-1 h-4 w-4 shrink-0" />
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        ) : null}
        {doc.status === "Aktif" && !isNew ? (
          <Button variant="outline" onClick={() => setPengembalianOpen(true)}>
            Kembalikan Kolektif
          </Button>
        ) : null}
      </div>

      {pengembalianOpen ? (
        <KolektifReturnModal
          pinjam={doc}
          onClose={() => setPengembalianOpen(false)}
          onDone={() => {
            setPengembalianOpen(false);
            navigate({ to: "/sch/$sekolah/perpustakaan/kolektif", params: { sekolah } });
          }}
        />
      ) : null}

      {(doc.docstatus ?? 0) >= 1 ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          <Badge tone="success" dot>Tersubmit</Badge> Pinjam kolektif resmi.
        </div>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/kolektif/$name")({ component: KolektifDetailPage });
