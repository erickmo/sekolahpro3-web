/**
 * Pengadaan Buku — detail / create.
 *
 * Inline child-table editor untuk Item Pengadaan Buku. Submit (docstatus=1)
 * irreversibel: auto-generate N Eksemplar Buku per item; cancel TIDAK revert.
 * Preview panel menampilkan total eksemplar + estimasi nomor inventaris
 * sebelum confirm dialog. Lihat PERP-ADR-0005.
 */
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  FormField,
  FormGrid,
  IconPlus,
  IconCheck,
  IconAlert,
  Input,
  PageHeader,
  SectionCard,
  Select,
  Textarea,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import {
  createResource,
  getResource,
  listResource,
  updateResource,
} from "@sekolahpro/api-client";
import { perpToday } from "../components/perpustakaan/perpFormatters";

type ItemRow = {
  buku: string;
  buku_label?: string;
  jumlah_eksemplar: number;
  harga_satuan: number;
  subtotal: number;
  prefix_inventaris?: string;
};

type Header = {
  name?: string;
  tanggal_pengadaan: string;
  sumber: "Pembelian" | "Hibah" | "Sumbangan";
  vendor: string;
  nomor_dokumen: string;
  total_biaya: number;
  total_eksemplar: number;
  catatan: string;
  docstatus?: number;
  items: ItemRow[];
};

const EMPTY_ITEM: ItemRow = {
  buku: "",
  jumlah_eksemplar: 1,
  harga_satuan: 0,
  subtotal: 0,
  prefix_inventaris: "",
};

function defaultHeader(): Header {
  return {
    tanggal_pengadaan: perpToday(),
    sumber: "Pembelian",
    vendor: "",
    nomor_dokumen: "",
    total_biaya: 0,
    total_eksemplar: 0,
    catatan: "",
    items: [{ ...EMPTY_ITEM }],
  };
}

async function searchBuku(q: string): Promise<SearchableOption[]> {
  const filters = q
    ? { or_filters: [["name", "like", `%${q}%`], ["judul", "like", `%${q}%`]] as [string, string, unknown][] }
    : {};
  const rows = await listResource<{ name: string; judul?: string }>("Buku", {
    fields: ["name", "judul"],
    ...filters,
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => {
    const opt: SearchableOption = { value: r.name, label: r.judul ?? r.name };
    if (r.judul) opt.hint = r.name;
    return opt;
  });
}

function PengadaanDetailPage() {
  const { name } = useParams({ from: "/perpustakaan/pengadaan/$name" });
  const navigate = useNavigate();
  const isNew = name === "new";

  const [doc, setDoc] = useState<Header>(() => defaultHeader());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await getResource<Header & { items?: ItemRow[] }>("Pengadaan Buku", name);
        if (!cancelled) {
          setDoc({
            ...defaultHeader(),
            ...d,
            items: (d.items ?? []).map((i) => ({ ...EMPTY_ITEM, ...i })),
          });
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Gagal memuat dokumen.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, name]);

  const totals = useMemo(() => {
    let totalEksemplar = 0;
    let totalBiaya = 0;
    for (const it of doc.items) {
      const qty = Number(it.jumlah_eksemplar) || 0;
      const harga = Number(it.harga_satuan) || 0;
      totalEksemplar += qty;
      totalBiaya += qty * harga;
    }
    return { totalEksemplar, totalBiaya };
  }, [doc.items]);

  const previewInventaris = useMemo(() => {
    const out: string[] = [];
    for (const it of doc.items) {
      const qty = Number(it.jumlah_eksemplar) || 0;
      if (!it.buku || qty === 0) continue;
      const prefix = it.prefix_inventaris?.trim() || it.buku.substring(0, 8);
      const first = `${prefix}-001`;
      const last = `${prefix}-${String(qty).padStart(3, "0")}`;
      out.push(`${it.buku_label ?? it.buku} → ${first} … ${last} (${qty} eksemplar)`);
    }
    return out;
  }, [doc.items]);

  const isReadonly = (doc.docstatus ?? 0) >= 1;

  const setItem = (idx: number, patch: Partial<ItemRow>) => {
    setDoc((prev) => {
      const items = [...prev.items];
      const merged = { ...items[idx]!, ...patch };
      merged.subtotal = (Number(merged.jumlah_eksemplar) || 0) * (Number(merged.harga_satuan) || 0);
      items[idx] = merged;
      return { ...prev, items };
    });
  };

  const addItem = () => setDoc((p) => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }));
  const removeItem = (idx: number) =>
    setDoc((p) => ({ ...p, items: p.items.length > 1 ? p.items.filter((_, i) => i !== idx) : p.items }));

  const validate = (): string | null => {
    if (!doc.tanggal_pengadaan) return "Tanggal pengadaan wajib diisi.";
    if (!doc.sumber) return "Sumber wajib diisi.";
    if (doc.sumber === "Pembelian" && !doc.vendor.trim()) return "Vendor wajib diisi untuk Pembelian.";
    for (let i = 0; i < doc.items.length; i++) {
      const it = doc.items[i]!;
      if (!it.buku) return `Baris #${i + 1}: Buku wajib diisi.`;
      if (!it.jumlah_eksemplar || it.jumlah_eksemplar < 1) return `Baris #${i + 1}: Jumlah ≥ 1.`;
    }
    return null;
  };

  const save = async (submit: boolean) => {
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        tanggal_pengadaan: doc.tanggal_pengadaan,
        sumber: doc.sumber,
        vendor: doc.vendor,
        nomor_dokumen: doc.nomor_dokumen,
        total_biaya: totals.totalBiaya,
        total_eksemplar: totals.totalEksemplar,
        catatan: doc.catatan,
        items: doc.items.map((it) => ({
          buku: it.buku,
          jumlah_eksemplar: Number(it.jumlah_eksemplar) || 0,
          harga_satuan: Number(it.harga_satuan) || 0,
          subtotal: (Number(it.jumlah_eksemplar) || 0) * (Number(it.harga_satuan) || 0),
          prefix_inventaris: it.prefix_inventaris ?? "",
        })),
      };
      if (submit) payload.docstatus = 1;
      let savedName = name;
      if (isNew) {
        const created = await createResource<{ name: string }>("Pengadaan Buku", payload);
        savedName = created.name;
      } else {
        await updateResource("Pengadaan Buku", name, payload);
      }
      navigate({ to: "/perpustakaan/pengadaan/$name", params: { name: savedName } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
      setConfirmSubmit(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-muted-fg">Memuat...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Perpustakaan / Pengadaan"
        title={isNew ? "Pengadaan Baru" : name}
        description={
          isReadonly
            ? "Pengadaan telah di-submit — eksemplar sudah ter-generate, tidak dapat diedit."
            : "Isi header dan item pengadaan. Submit akan auto-generate eksemplar buku."
        }
      />

      {err ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      <SectionCard title="Informasi Pengadaan">
        <FormGrid cols={3}>
          <FormField label="Tanggal Pengadaan" htmlFor="tgl" required>
            <Input
              id="tgl"
              type="date"
              value={doc.tanggal_pengadaan}
              disabled={isReadonly}
              onChange={(e) => setDoc((p) => ({ ...p, tanggal_pengadaan: e.target.value }))}
            />
          </FormField>
          <FormField label="Sumber" htmlFor="sumber" required>
            <Select
              id="sumber"
              value={doc.sumber}
              disabled={isReadonly}
              onChange={(e) => setDoc((p) => ({ ...p, sumber: e.target.value as Header["sumber"] }))}
            >
              <option value="Pembelian">Pembelian</option>
              <option value="Hibah">Hibah</option>
              <option value="Sumbangan">Sumbangan</option>
            </Select>
          </FormField>
          <FormField label="No. Dokumen" htmlFor="nodok">
            <Input
              id="nodok"
              value={doc.nomor_dokumen}
              disabled={isReadonly}
              placeholder="PO-2026-001 / Surat Hibah ..."
              onChange={(e) => setDoc((p) => ({ ...p, nomor_dokumen: e.target.value }))}
            />
          </FormField>
          <FormField label="Vendor / Penyumbang" htmlFor="vendor" required={doc.sumber === "Pembelian"}>
            <Input
              id="vendor"
              value={doc.vendor}
              disabled={isReadonly}
              placeholder="PT Penerbit Sejahtera / Bpk. Andi ..."
              onChange={(e) => setDoc((p) => ({ ...p, vendor: e.target.value }))}
            />
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard
        title="Item Pengadaan"
        description="Setiap baris akan generate N eksemplar saat Submit."
        action={
          !isReadonly ? (
            <Button variant="outline" onClick={addItem}>
              <span className="mr-1 inline-flex h-4 w-4"><IconPlus /></span>
              Tambah Baris
            </Button>
          ) : undefined
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-fg">
                <th className="px-2 py-2 w-8">#</th>
                <th className="px-2 py-2 min-w-[220px]">Buku</th>
                <th className="px-2 py-2 w-24 text-right">Jumlah</th>
                <th className="px-2 py-2 w-36 text-right">Harga Satuan</th>
                <th className="px-2 py-2 w-36 text-right">Subtotal</th>
                <th className="px-2 py-2 w-32">Prefix Inv.</th>
                <th className="px-2 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((it, idx) => (
                <tr key={idx} className="border-b border-border/50">
                  <td className="px-2 py-2 text-xs text-muted-fg tabular-nums">{idx + 1}</td>
                  <td className="px-2 py-2">
                    <SearchableSelect
                      value={it.buku}
                      onChange={(v) => setItem(idx, { buku: v })}
                      loadOptions={searchBuku}
                      resolveLabel={async (v) => {
                        try {
                          const rows = await listResource<{ name: string; judul?: string }>("Buku", {
                            fields: ["name", "judul"],
                            filters: { name: v },
                            limit_page_length: 1,
                          });
                          const lbl = rows[0]?.judul ?? v;
                          setItem(idx, { buku_label: lbl });
                          return lbl;
                        } catch {
                          return v;
                        }
                      }}
                      placeholder="Cari judul buku…"
                      disabled={isReadonly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      min={1}
                      value={String(it.jumlah_eksemplar)}
                      disabled={isReadonly}
                      onChange={(e) => setItem(idx, { jumlah_eksemplar: Number(e.target.value) })}
                      className="text-right tabular-nums"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      min={0}
                      value={String(it.harga_satuan)}
                      disabled={isReadonly}
                      onChange={(e) => setItem(idx, { harga_satuan: Number(e.target.value) })}
                      className="text-right tabular-nums"
                    />
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-fg">
                    Rp {((Number(it.jumlah_eksemplar) || 0) * (Number(it.harga_satuan) || 0)).toLocaleString("id-ID")}
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={it.prefix_inventaris ?? ""}
                      disabled={isReadonly}
                      placeholder="INV-2026"
                      onChange={(e) => setItem(idx, { prefix_inventaris: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-2">
                    {!isReadonly ? (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-xs text-rose-600 hover:underline"
                        disabled={doc.items.length <= 1}
                      >
                        Hapus
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2 text-right text-xs text-muted-fg" colSpan={2}>
                  Total
                </td>
                <td className="px-2 py-2 text-right tabular-nums font-medium">
                  {totals.totalEksemplar.toLocaleString("id-ID")} eks.
                </td>
                <td className="px-2 py-2 text-right tabular-nums font-medium" colSpan={3}>
                  Rp {totals.totalBiaya.toLocaleString("id-ID")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Catatan">
        <Textarea
          value={doc.catatan}
          disabled={isReadonly}
          onChange={(e) => setDoc((p) => ({ ...p, catatan: e.target.value }))}
          rows={3}
          placeholder="Keterangan tambahan pengadaan..."
        />
      </SectionCard>

      {previewInventaris.length > 0 && !isReadonly ? (
        <SectionCard
          title="Preview Generasi Eksemplar"
          description="Nomor inventaris yang akan dibuat saat Submit."
        >
          <div className="space-y-2">
            {previewInventaris.map((line, i) => (
              <div key={i} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-mono text-fg">
                {line}
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
              <span className="h-4 w-4 shrink-0"><IconAlert /></span>
              <span>
                Submit akan generate <b>{totals.totalEksemplar} eksemplar permanen</b> — cancel tidak akan menghapus eksemplar.
              </span>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {!isReadonly ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/perpustakaan/pengadaan" })} disabled={saving}>
            Kembali
          </Button>
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>
            Simpan Draft
          </Button>
          <Button onClick={() => setConfirmSubmit(true)} disabled={saving || totals.totalEksemplar === 0}>
            <span className="mr-1 inline-flex h-4 w-4"><IconCheck /></span>
            Submit
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <span className="h-4 w-4"><IconCheck /></span>
            Pengadaan disubmit — <Badge tone="success" dot>{totals.totalEksemplar} eksemplar</Badge> sudah dibuat.
          </div>
          <Button variant="outline" onClick={() => navigate({ to: "/perpustakaan/pengadaan" })}>
            Kembali
          </Button>
        </div>
      )}

      {confirmSubmit ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmSubmit(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-fg">Konfirmasi Submit</h3>
            <p className="mt-2 text-sm text-muted-fg">
              <b>{totals.totalEksemplar} eksemplar</b> akan di-generate secara permanen.
              Tindakan ini tidak bisa dibatalkan (cancel tidak menghapus eksemplar).
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmSubmit(false)} disabled={saving}>
                Batal
              </Button>
              <Button onClick={() => save(true)} disabled={saving}>
                {saving ? "Memproses..." : "Ya, Submit"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/perpustakaan/pengadaan/$name")({ component: PengadaanDetailPage });
