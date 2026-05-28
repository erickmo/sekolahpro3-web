/**
 * Stock Opname — scan mode.
 *
 * Long-running session: pustakawan scan eksemplar via barcode/RFID berjam-jam.
 * Risk: tab close / refresh hilangkan progress. Mitigasi:
 *   1) Autosave draft ke server tiap 800ms (debounced) saat ada perubahan.
 *   2) Backup ke localStorage tiap perubahan (key per opname name).
 *   3) beforeunload guard jika ada dirty unsaved.
 *
 * Lihat PERP-ADR-0004.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  FormField,
  FormGrid,
  IconAlert,
  IconCheck,
  Input,
  PageHeader,
  SectionCard,
  Select,
  Textarea,
} from "@sekolahpro/ui";
import { createResource, getResource, listResource, updateResource } from "@sekolahpro/api-client";
import { perpToday } from "../components/perpustakaan/perpFormatters";

type ScanRow = {
  eksemplar: string;
  status_temuan: "Hadir" | "Hilang" | "Rusak";
  lokasi_rak_aktual?: string;
  catatan?: string;
  scanned_at: number;
};

type Header = {
  name?: string;
  tanggal: string;
  lokasi_rak_filter: string;
  auditor: string;
  catatan: string;
  items: ScanRow[];
  docstatus?: number;
};

const AUTOSAVE_MS = 800;

function defaultHeader(): Header {
  return {
    tanggal: perpToday(),
    lokasi_rak_filter: "",
    auditor: "",
    catatan: "",
    items: [],
  };
}

function lsKey(name: string): string {
  return `perp:opname:draft:${name}`;
}

function OpnameScanPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const { name } = useParams({ from: "/$sekolah/perpustakaan/inventaris/opname/$name" });
  const navigate = useNavigate();
  const isNew = name === "new";

  const [doc, setDoc] = useState<Header>(() => defaultHeader());
  const [currentName, setCurrentName] = useState<string>(name);
  const [loading, setLoading] = useState(!isNew);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scanStatus, setScanStatus] = useState<ScanRow["status_temuan"]>("Hadir");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<number | null>(null);

  // load existing
  useEffect(() => {
    if (isNew) {
      const cached = typeof window !== "undefined" ? window.localStorage.getItem(lsKey("new")) : null;
      if (cached) {
        try {
          setDoc(JSON.parse(cached) as Header);
        } catch {
          // ignore corrupt cache
        }
      }
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const d = await getResource<Header & { items?: ScanRow[] }>("Stock Opname Perpustakaan", name);
        if (!cancelled) {
          setDoc({
            ...defaultHeader(),
            ...d,
            items: (d.items ?? []).map((i) => ({ ...i, scanned_at: i.scanned_at ?? Date.now() })),
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

  const isReadonly = (doc.docstatus ?? 0) >= 1;

  // localStorage backup on every change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isReadonly) return;
    window.localStorage.setItem(lsKey(currentName), JSON.stringify(doc));
  }, [doc, currentName, isReadonly]);

  // beforeunload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const saveDraft = useCallback(async () => {
    if (isReadonly) return;
    setSaving(true);
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        tanggal: doc.tanggal,
        lokasi_rak_filter: doc.lokasi_rak_filter,
        auditor: doc.auditor,
        catatan: doc.catatan,
        total_scan: doc.items.length,
        total_hilang: doc.items.filter((i) => i.status_temuan === "Hilang").length,
        total_rusak: doc.items.filter((i) => i.status_temuan === "Rusak").length,
        items: doc.items.map((it) => ({
          eksemplar: it.eksemplar,
          status_temuan: it.status_temuan,
          lokasi_rak_aktual: it.lokasi_rak_aktual ?? "",
          catatan: it.catatan ?? "",
        })),
      };
      if (currentName === "new") {
        const created = await createResource<{ name: string }>("Stock Opname Perpustakaan", payload);
        setCurrentName(created.name);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(lsKey("new"));
        }
        // shallow URL update so refresh resumes the right doc
        window.history.replaceState(null, "", `/perpustakaan/inventaris/opname/${created.name}`);
      } else {
        await updateResource("Stock Opname Perpustakaan", currentName, payload);
      }
      setLastSaved(new Date());
      setDirty(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal autosave.");
    } finally {
      setSaving(false);
    }
  }, [doc, currentName, isReadonly]);

  // debounced autosave
  useEffect(() => {
    if (!dirty || isReadonly) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      void saveDraft();
    }, AUTOSAVE_MS);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [dirty, saveDraft, isReadonly]);

  const stats = useMemo(() => {
    const total = doc.items.length;
    const hadir = doc.items.filter((i) => i.status_temuan === "Hadir").length;
    const hilang = doc.items.filter((i) => i.status_temuan === "Hilang").length;
    const rusak = doc.items.filter((i) => i.status_temuan === "Rusak").length;
    return { total, hadir, hilang, rusak };
  }, [doc.items]);

  const recentScans = useMemo(() => doc.items.slice(-10).reverse(), [doc.items]);

  const handleScan = async (raw: string) => {
    const eksemplar = raw.trim();
    if (!eksemplar) return;
    // duplicate guard
    const exists = doc.items.find((i) => i.eksemplar === eksemplar);
    if (exists) {
      setErr(`Eksemplar ${eksemplar} sudah discan (${exists.status_temuan}).`);
      setScanInput("");
      return;
    }
    setErr(null);
    setDoc((p) => ({
      ...p,
      items: [...p.items, { eksemplar, status_temuan: scanStatus, scanned_at: Date.now() }],
    }));
    setDirty(true);
    setScanInput("");
  };

  const updateRow = (idx: number, patch: Partial<ScanRow>) => {
    setDoc((p) => {
      const items = [...p.items];
      items[idx] = { ...items[idx]!, ...patch };
      return { ...p, items };
    });
    setDirty(true);
  };

  const removeRow = (idx: number) => {
    setDoc((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const submitOpname = async () => {
    if (doc.items.length === 0) {
      setErr("Tidak ada item discan. Tidak bisa submit.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      if (dirty) await saveDraft();
      await updateResource("Stock Opname Perpustakaan", currentName, { docstatus: 1 });
      if (typeof window !== "undefined") window.localStorage.removeItem(lsKey(currentName));
      navigate({ to: "/$sekolah/perpustakaan/inventaris/opname/$name", params: { sekolah, name: currentName } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal submit.");
    } finally {
      setSaving(false);
      setConfirmSubmit(false);
    }
  };

  // load auditors for select (best-effort)
  const [auditorOptions, setAuditorOptions] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    listResource<{ name: string; full_name?: string }>("User", {
      fields: ["name", "full_name"],
      filters: { enabled: 1 },
      limit_page_length: 50,
    })
      .then((rows) =>
        setAuditorOptions(rows.map((r) => ({ value: r.name, label: r.full_name ?? r.name }))),
      )
      .catch(() => undefined);
  }, []);

  if (loading) return <div className="p-6 text-sm text-muted-fg">Memuat...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Perpustakaan / Inventaris / Stock Opname"
        title={isNew ? "Sesi Opname Baru" : currentName}
        description={
          isReadonly
            ? "Sesi opname sudah disubmit. Side-effect (Hilang → Eksemplar non-aktif, Rusak → kondisi) sudah diterapkan."
            : "Scan eksemplar via barcode/RFID. Draft auto-save otomatis."
        }
      />

      {err ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      <SectionCard title="Setup Sesi">
        <FormGrid cols={3}>
          <FormField label="Tanggal" htmlFor="tgl">
            <Input
              id="tgl"
              type="date"
              value={doc.tanggal}
              disabled={isReadonly}
              onChange={(e) => {
                setDoc((p) => ({ ...p, tanggal: e.target.value }));
                setDirty(true);
              }}
            />
          </FormField>
          <FormField label="Filter Lokasi Rak" htmlFor="rak" hint="Kosongkan = audit semua rak">
            <Input
              id="rak"
              value={doc.lokasi_rak_filter}
              disabled={isReadonly}
              placeholder="Rak A, Lt 2..."
              onChange={(e) => {
                setDoc((p) => ({ ...p, lokasi_rak_filter: e.target.value }));
                setDirty(true);
              }}
            />
          </FormField>
          <FormField label="Auditor" htmlFor="auditor">
            <Select
              id="auditor"
              value={doc.auditor}
              disabled={isReadonly}
              onChange={(e) => {
                setDoc((p) => ({ ...p, auditor: e.target.value }));
                setDirty(true);
              }}
            >
              <option value="">— Pilih —</option>
              {auditorOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </FormField>
        </FormGrid>
      </SectionCard>

      {!isReadonly ? (
        <SectionCard
          title="Scan Eksemplar"
          description="Tempatkan kursor di input lalu scan barcode / RFID. Status default dapat diubah di kanan."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="scan" className="mb-1 block text-xs text-muted-fg">Kode Eksemplar</label>
              <Input
                id="scan"
                ref={scanRef}
                autoFocus
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleScan(scanInput);
                  }
                }}
                placeholder="Scan atau ketik kode eksemplar lalu Enter"
                className="text-lg tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="scan-status" className="mb-1 block text-xs text-muted-fg">Status Default</label>
              <Select
                id="scan-status"
                value={scanStatus}
                onChange={(e) => setScanStatus(e.target.value as ScanRow["status_temuan"])}
                className="min-w-[140px]"
              >
                <option value="Hadir">Hadir</option>
                <option value="Hilang">Hilang</option>
                <option value="Rusak">Rusak</option>
              </Select>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-4">
        <StatBox label="Total Scan" value={stats.total} tone="brand" />
        <StatBox label="Hadir" value={stats.hadir} tone="success" />
        <StatBox label="Hilang" value={stats.hilang} tone="danger" />
        <StatBox label="Rusak" value={stats.rusak} tone="warning" />
      </div>

      <SectionCard
        title="Hasil Scan"
        description={`${doc.items.length} eksemplar`}
        action={
          <span className="text-xs text-muted-fg">
            {saving ? "Menyimpan..." : lastSaved ? `Tersimpan ${lastSaved.toLocaleTimeString("id-ID")}` : "Belum tersimpan"}
          </span>
        }
      >
        {doc.items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-fg">
            Belum ada scan. Mulai scan eksemplar di atas.
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left text-xs text-muted-fg">
                  <th className="px-2 py-2 w-8">#</th>
                  <th className="px-2 py-2">Eksemplar</th>
                  <th className="px-2 py-2 w-32">Status</th>
                  <th className="px-2 py-2 w-40">Lokasi Aktual</th>
                  <th className="px-2 py-2">Catatan</th>
                  <th className="px-2 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {[...doc.items].reverse().map((it, revIdx) => {
                  const idx = doc.items.length - 1 - revIdx;
                  return (
                    <tr key={`${it.eksemplar}-${idx}`} className="border-b border-border/50">
                      <td className="px-2 py-1.5 text-xs text-muted-fg tabular-nums">{idx + 1}</td>
                      <td className="px-2 py-1.5 font-mono text-xs">{it.eksemplar}</td>
                      <td className="px-2 py-1.5">
                        {isReadonly ? (
                          <Badge tone={it.status_temuan === "Hadir" ? "success" : it.status_temuan === "Hilang" ? "danger" : "warning"} dot>
                            {it.status_temuan}
                          </Badge>
                        ) : (
                          <Select
                            value={it.status_temuan}
                            onChange={(e) => updateRow(idx, { status_temuan: e.target.value as ScanRow["status_temuan"] })}
                          >
                            <option value="Hadir">Hadir</option>
                            <option value="Hilang">Hilang</option>
                            <option value="Rusak">Rusak</option>
                          </Select>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={it.lokasi_rak_aktual ?? ""}
                          disabled={isReadonly}
                          onChange={(e) => updateRow(idx, { lokasi_rak_aktual: e.target.value })}
                          placeholder="—"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={it.catatan ?? ""}
                          disabled={isReadonly}
                          onChange={(e) => updateRow(idx, { catatan: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        {!isReadonly ? (
                          <button type="button" onClick={() => removeRow(idx)} className="text-xs text-rose-600 hover:underline">
                            Hapus
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Catatan Sesi">
        <Textarea
          value={doc.catatan}
          disabled={isReadonly}
          rows={3}
          onChange={(e) => {
            setDoc((p) => ({ ...p, catatan: e.target.value }));
            setDirty(true);
          }}
        />
      </SectionCard>

      {!isReadonly ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/$sekolah/perpustakaan/inventaris/opname", params: { sekolah } })}>
            Tutup (Draft Tersimpan)
          </Button>
          <Button variant="outline" onClick={() => void saveDraft()} disabled={saving}>
            Simpan Sekarang
          </Button>
          <Button onClick={() => setConfirmSubmit(true)} disabled={saving || doc.items.length === 0}>
            <span className="mr-1 inline-flex h-4 w-4"><IconCheck /></span>
            Submit Opname
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <Button variant="outline" onClick={() => navigate({ to: "/$sekolah/perpustakaan/inventaris/opname", params: { sekolah } })}>
            Kembali
          </Button>
        </div>
      )}

      {confirmSubmit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmSubmit(false)}>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-fg">Konfirmasi Submit Opname</h3>
            <p className="mt-2 text-sm text-muted-fg">
              {stats.hilang} eksemplar akan ditandai <b>Hilang</b> dan dinon-aktifkan.
              {stats.rusak > 0 ? ` ${stats.rusak} eksemplar akan ditandai Rusak.` : ""}
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
              <span className="h-4 w-4 shrink-0"><IconAlert /></span>
              <span>Cancel tidak akan revert side-effect — koreksi harus via BA Kerusakan / opname baru.</span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmSubmit(false)}>Batal</Button>
              <Button onClick={submitOpname} disabled={saving}>{saving ? "Memproses..." : "Ya, Submit"}</Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      {/* placeholder reference to silence unused recentScans */}
      <span className="hidden">{recentScans.length}</span>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone: "brand" | "success" | "danger" | "warning" }) {
  const toneClass = {
    brand: "border-brand/40 bg-brand/5 text-brand",
    success: "border-emerald-500/40 bg-emerald-500/5 text-emerald-700",
    danger: "border-rose-500/40 bg-rose-500/5 text-rose-700",
    warning: "border-amber-500/40 bg-amber-500/5 text-amber-700",
  }[tone];
  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString("id-ID")}</div>
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/perpustakaan/inventaris/opname/$name")({ component: OpnameScanPage });
