/**
 * Pinjam Kolektif Kelas — detail / create.
 *
 * Bulk-add eksemplar via paste newline-delimited (per UX rec).
 * Pengembalian kolektif sebagai counter-transaction terpisah (button "Kembalikan Kolektif").
 * Lihat PERP-ADR-0007.
 */
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  FormField,
  FormGrid,
  IconCheck,
  Input,
  PageHeader,
  SectionCard,
  Textarea,
  DatePicker,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import {
  getResource,
  listResource,
  updateResource,
} from "@sekolahpro/api-client";
import { perpToday } from "../components/perpustakaan/perpFormatters";
import { insertAndSubmit } from "../components/perpustakaan/circulation";

/** Class-loan window in days (longer than the individual terminal's 7). */
const KOLEKTIF_LOAN_DAYS = 14;
/** terminal_id stamped on records created from the web UI (not a kiosk). */
const TERMINAL_WEB = "WEB-UI";
/** Route param sentinel for an unsaved (new) record. */
const NEW_RECORD = "new";

type ItemRow = { eksemplar: string; nomor_inventaris?: string; judul_buku?: string };

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

async function searchGuru(q: string): Promise<SearchableOption[]> {
  const f = q ? { or_filters: [["name", "like", `%${q}%`], ["nama_lengkap", "like", `%${q}%`]] as [string, string, unknown][] } : {};
  const rows = await listResource<{ name: string; nama_lengkap?: string }>("Guru", {
    fields: ["name", "nama_lengkap"], ...f, limit_page_length: 20,
  });
  return rows.map((r) => ({ value: r.name, label: r.nama_lengkap ?? r.name }));
}

async function searchRombel(q: string): Promise<SearchableOption[]> {
  const f = q ? { or_filters: [["name", "like", `%${q}%`], ["nama_rombel", "like", `%${q}%`]] as [string, string, unknown][] } : {};
  const rows = await listResource<{ name: string; nama_rombel?: string }>("Rombongan Belajar", {
    fields: ["name", "nama_rombel"], ...f, limit_page_length: 20,
  });
  return rows.map((r) => ({ value: r.name, label: r.nama_rombel ?? r.name }));
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

  const resolveItem = async (code: string): Promise<ItemRow | { error: string }> => {
    const c = code.trim();
    if (!c) return { error: "kosong" };
    const rows = await listResource<{ name: string; nomor_inventaris?: string; buku?: string; status?: string }>(
      "Eksemplar Buku",
      {
        fields: ["name", "nomor_inventaris", "buku", "status"],
        or_filters: [["name", "=", c], ["nomor_inventaris", "=", c]] as [string, string, unknown][],
        limit_page_length: 1,
      },
    );
    const ek = rows[0];
    if (!ek) return { error: `${c}: tidak ditemukan` };
    if (ek.status && ek.status !== "Tersedia") return { error: `${c}: status ${ek.status}` };
    return { eksemplar: ek.name, nomor_inventaris: ek.nomor_inventaris ?? "", judul_buku: ek.buku ?? "" };
  };

  const handleBulkAdd = async () => {
    const codes = bulkInput
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (codes.length === 0) return;
    setBulkBusy(true);
    setErr(null);
    const added: ItemRow[] = [];
    const errors: string[] = [];
    for (const c of codes) {
      if (doc.items.some((i) => i.eksemplar === c || i.nomor_inventaris === c)) {
        errors.push(`${c}: duplikat`);
        continue;
      }
      const r = await resolveItem(c);
      if ("error" in r) errors.push(r.error);
      else if (!added.some((a) => a.eksemplar === r.eksemplar)) added.push(r);
    }
    setDoc((p) => ({ ...p, items: [...p.items, ...added] }));
    setBulkInput("");
    setBulkBusy(false);
    if (errors.length > 0) setErr(`${added.length} ditambah, ${errors.length} gagal: ${errors.slice(0, 5).join("; ")}${errors.length > 5 ? "…" : ""}`);
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
        <FormGrid cols={3}>
          <FormField label="Guru PJ" htmlFor="guru" required>
            <SearchableSelect
              value={doc.guru_penanggung_jawab}
              disabled={isReadonly}
              onChange={(v) => setDoc((p) => ({ ...p, guru_penanggung_jawab: v }))}
              loadOptions={searchGuru}
              resolveLabel={async (v) => v}
              placeholder="Cari guru…"
            />
          </FormField>
          <FormField label="Rombel" htmlFor="rombel" required>
            <SearchableSelect
              value={doc.rombongan}
              disabled={isReadonly}
              onChange={(v) => setDoc((p) => ({ ...p, rombongan: v }))}
              loadOptions={searchRombel}
              resolveLabel={async (v) => v}
              placeholder="Cari rombel…"
            />
          </FormField>
          <FormField label="Tujuan / Topik" htmlFor="tujuan">
            <Input id="tujuan" value={doc.tujuan} disabled={isReadonly}
              placeholder="Paket bacaan literasi Sept..."
              onChange={(e) => setDoc((p) => ({ ...p, tujuan: e.target.value }))} />
          </FormField>
          <FormField label="Tanggal Pinjam" htmlFor="tp" required>
            <DatePicker id="tp" value={doc.tanggal_pinjam} disabled={isReadonly}
              onChange={(v) => setDoc((p) => ({ ...p, tanggal_pinjam: v }))} />
          </FormField>
          <FormField label="Rencana Kembali" htmlFor="tkr" required>
            <DatePicker id="tkr" value={doc.tanggal_kembali_rencana} disabled={isReadonly}
              onChange={(v) => setDoc((p) => ({ ...p, tanggal_kembali_rencana: v }))} />
          </FormField>
          <FormField label="Status" htmlFor="st">
            <SearchableSelect
              id="st"
              value={doc.status ?? "Aktif"}
              disabled={isReadonly}
              onChange={(v) => setDoc((p) => ({ ...p, status: v }))}
              options={[
                { value: "Aktif", label: "Aktif" },
                { value: "Selesai", label: "Selesai" },
                { value: "Terlambat", label: "Terlambat" },
                { value: "Batal", label: "Batal" },
              ]}
            />
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard
        title={`Eksemplar (${stats.totalEks})`}
        description="Paste kode/nomor inventaris (newline atau koma) untuk bulk add."
      >
        {!isReadonly ? (
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <Textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={3}
              placeholder={"INV-001\nINV-002\nINV-003"}
              className="flex-1 font-mono text-xs"
            />
            <Button onClick={handleBulkAdd} disabled={bulkBusy || !bulkInput.trim()}>
              {bulkBusy ? "Validasi..." : "Tambahkan"}
            </Button>
          </div>
        ) : null}
        {doc.items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-fg">
            Belum ada eksemplar.
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left text-xs text-muted-fg">
                  <th className="px-2 py-2 w-8">#</th>
                  <th className="px-2 py-2">Eksemplar</th>
                  <th className="px-2 py-2">Nomor Inventaris</th>
                  <th className="px-2 py-2">Judul / Buku</th>
                  <th className="px-2 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {doc.items.map((it, idx) => (
                  <tr key={`${it.eksemplar}-${idx}`} className="border-b border-border/50">
                    <td className="px-2 py-1.5 text-xs text-muted-fg tabular-nums">{idx + 1}</td>
                    <td className="px-2 py-1.5 font-mono text-xs">{it.eksemplar}</td>
                    <td className="px-2 py-1.5 font-mono text-xs">{it.nomor_inventaris ?? "—"}</td>
                    <td className="px-2 py-1.5">{it.judul_buku ?? "—"}</td>
                    <td className="px-2 py-1.5">
                      {!isReadonly ? (
                        <button type="button" onClick={() => removeItem(idx)} className="text-xs text-rose-600 hover:underline">
                          Hapus
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
        <PengembalianKolektifModal
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

function PengembalianKolektifModal({
  pinjam,
  onClose,
  onDone,
}: {
  pinjam: Header;
  onClose: () => void;
  onDone: () => void;
}) {
  const [tgl, setTgl] = useState(perpToday());
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      // insert→submit so on_submit runs (denda/eksemplar/reservasi). PERP-GAP-25
      await insertAndSubmit("Pengembalian Kolektif Kelas", {
        pinjam_kolektif: pinjam.name,
        guru_penanggung_jawab: pinjam.guru_penanggung_jawab,
        rombongan: pinjam.rombongan,
        tanggal_kembali_aktual: tgl,
        jumlah_eksemplar_kembali: pinjam.items.length,
        terminal_id: TERMINAL_WEB,
        catatan,
      });
      // Patch pinjam header → Selesai (idempotent if the submit hook also sets it).
      await updateResource("Pinjam Kolektif Kelas", pinjam.name!, { status: "Selesai" });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal proses pengembalian.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-fg">Pengembalian Kolektif</h3>
        <p className="mt-1 text-sm text-muted-fg">
          {pinjam.items.length} eksemplar akan dicatat kembali dari rombel <b>{pinjam.rombongan}</b>.
        </p>
        {err ? <div className="mt-3 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700">{err}</div> : null}
        <div className="mt-4 space-y-3">
          <FormField label="Tanggal Kembali Aktual" htmlFor="tk" required>
            <DatePicker id="tk" value={tgl} onChange={setTgl} />
          </FormField>
          <FormField label="Catatan" htmlFor="ck">
            <Textarea id="ck" value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} />
          </FormField>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Memproses..." : "Submit Pengembalian"}</Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/kolektif/$name")({ component: KolektifDetailPage });
