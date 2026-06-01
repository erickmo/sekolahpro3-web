/**
 * State + I/O hook for the Pengadaan Buku detail page (PERP-GAP god-file split).
 *
 * Layer: data/orchestration hook. Owns the editable header + child-table state,
 * the fetch of an existing doc, validation, and the draft/submit RPC. The route
 * and presentational sub-components stay free of business logic — they only read
 * this hook's return value and call its callbacks. Code moved verbatim from the
 * former route component body; only prop/return plumbing was added.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  createResource,
  getResource,
  updateResource,
} from "@sekolahpro/api-client";
import { perpToday } from "./perpFormatters";
import { computePengadaanTotals, buildPreviewInventaris } from "./pengadaanCompute";

/** One acquisition line item, as edited in the inline child-table. */
export type ItemRow = {
  buku: string;
  buku_label?: string;
  jumlah_eksemplar: number;
  harga_satuan: number;
  subtotal: number;
  prefix_inventaris?: string;
};

/** Acquisition header document plus its embedded line items. */
export type Header = {
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

/** Frappe doctype edited by this page. */
const PENGADAAN_DOCTYPE = "Pengadaan Buku";
/** docstatus value that marks a document as submitted (read-only). */
const DOCSTATUS_SUBMITTED = 1;

export const EMPTY_ITEM: ItemRow = {
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

/** Build the RPC payload for save/submit from the current header state. */
function toPayload(doc: Header, totals: { totalBiaya: number; totalEksemplar: number }): Record<string, unknown> {
  return {
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
}

/** Validate header + items; returns the first error message, or null when valid. */
function validate(doc: Header): string | null {
  if (!doc.tanggal_pengadaan) return "Tanggal pengadaan wajib diisi.";
  if (!doc.sumber) return "Sumber wajib diisi.";
  if (doc.sumber === "Pembelian" && !doc.vendor.trim()) return "Vendor wajib diisi untuk Pembelian.";
  for (let i = 0; i < doc.items.length; i++) {
    const it = doc.items[i]!;
    if (!it.buku) return `Baris #${i + 1}: Buku wajib diisi.`;
    if (!it.jumlah_eksemplar || it.jumlah_eksemplar < 1) return `Baris #${i + 1}: Jumlah ≥ 1.`;
  }
  return null;
}

/** Everything the page + its sub-components need from the acquisition form. */
export interface PengadaanFormState {
  doc: Header;
  setDoc: React.Dispatch<React.SetStateAction<Header>>;
  isNew: boolean;
  isReadonly: boolean;
  loading: boolean;
  saving: boolean;
  err: string | null;
  confirmSubmit: boolean;
  setConfirmSubmit: (v: boolean) => void;
  totals: ReturnType<typeof computePengadaanTotals>;
  previewInventaris: string[];
  setItem: (idx: number, patch: Partial<ItemRow>) => void;
  addItem: () => void;
  removeItem: (idx: number) => void;
  save: (submit: boolean) => Promise<void>;
  goBack: () => void;
}

/**
 * Orchestrates the Pengadaan detail page: loads an existing document, exposes
 * editable state + derived totals/preview, and persists drafts or submits.
 * Submit (docstatus=1) is irreversible — it auto-generates N eksemplar per item.
 */
export function usePengadaanSubmit(): PengadaanFormState {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const { name } = useParams({ from: "/sch/$sekolah/perpustakaan/pengadaan/$name" });
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
        const d = await getResource<Header & { items?: ItemRow[] }>(PENGADAAN_DOCTYPE, name);
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

  const totals = useMemo(() => computePengadaanTotals(doc.items), [doc.items]);
  const previewInventaris = useMemo(() => buildPreviewInventaris(doc.items), [doc.items]);

  const isReadonly = (doc.docstatus ?? 0) >= DOCSTATUS_SUBMITTED;

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

  const save = async (submit: boolean) => {
    const v = validate(doc);
    if (v) {
      setErr(v);
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const payload = toPayload(doc, totals);
      if (submit) payload.docstatus = DOCSTATUS_SUBMITTED;
      let savedName = name;
      if (isNew) {
        const created = await createResource<{ name: string }>(PENGADAAN_DOCTYPE, payload);
        savedName = created.name;
      } else {
        await updateResource(PENGADAAN_DOCTYPE, name, payload);
      }
      navigate({ to: "/sch/$sekolah/perpustakaan/pengadaan/$name", params: { sekolah, name: savedName } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
      setConfirmSubmit(false);
    }
  };

  const goBack = () =>
    navigate({ to: "/sch/$sekolah/perpustakaan/pengadaan", params: { sekolah } });

  return {
    doc,
    setDoc,
    isNew,
    isReadonly,
    loading,
    saving,
    err,
    confirmSubmit,
    setConfirmSubmit,
    totals,
    previewInventaris,
    setItem,
    addItem,
    removeItem,
    save,
    goBack,
  };
}
