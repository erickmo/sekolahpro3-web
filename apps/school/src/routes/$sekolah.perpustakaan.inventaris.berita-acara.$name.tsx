/**
 * BA Kerusakan Buku — detail (create / edit / approve).
 *
 * Pustakawan: input + upload foto + save Draft.
 * Kepala Perpustakaan: review + pilih keputusan + Submit (docstatus=1).
 * Side-effect per keputusan diterapkan backend on_submit. Lihat PERP-ADR-0006.
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

type BA = {
  name?: string;
  tanggal_kejadian: string;
  eksemplar: string;
  pelapor: string;
  jenis_kerusakan: "" | "Rusak Ringan" | "Rusak Berat" | "Hilang";
  keputusan: "" | "Diperbaiki" | "Hapus" | "Ganti Rugi";
  nilai_ganti_rugi: number;
  deskripsi: string;
  foto: string;
  catatan_keputusan: string;
  docstatus?: number;
};

const MAX_FOTO_BYTES = 1024 * 1024;

function defaultBA(): BA {
  return {
    tanggal_kejadian: perpToday(),
    eksemplar: "",
    pelapor: "",
    jenis_kerusakan: "",
    keputusan: "",
    nilai_ganti_rugi: 0,
    deskripsi: "",
    foto: "",
    catatan_keputusan: "",
  };
}

async function searchEksemplar(q: string): Promise<SearchableOption[]> {
  const filters = q
    ? { or_filters: [["name", "like", `%${q}%`], ["nomor_inventaris", "like", `%${q}%`]] as [string, string, unknown][] }
    : {};
  const rows = await listResource<{ name: string; nomor_inventaris?: string; buku?: string }>("Eksemplar Buku", {
    fields: ["name", "nomor_inventaris", "buku"],
    ...filters,
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => {
    const opt: SearchableOption = { value: r.name, label: r.nomor_inventaris ?? r.name };
    if (r.buku) opt.hint = r.buku;
    return opt;
  });
}

async function uploadFoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("is_private", "0");
  fd.append("folder", "Home/Attachments");
  const res = await fetch("/api/method/upload_file", { method: "POST", body: fd, credentials: "include" });
  if (!res.ok) throw new Error(`Upload gagal (${res.status})`);
  const json = (await res.json()) as { message?: { file_url?: string } };
  const url = json?.message?.file_url;
  if (!url) throw new Error("Upload gagal: respons tidak valid.");
  return url;
}

async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_FOTO_BYTES) return file;
  const bitmap = await createImageBitmap(file);
  const ratio = Math.sqrt(MAX_FOTO_BYTES / file.size);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.8));
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}

function BADetailPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const { name } = useParams({ from: "/$sekolah/perpustakaan/inventaris/berita-acara/$name" });
  const navigate = useNavigate();
  const isNew = name === "new";

  const [doc, setDoc] = useState<BA>(() => defaultBA());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [bukuHarga, setBukuHarga] = useState<number | null>(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await getResource<BA>("Berita Acara Kerusakan Buku", name);
        if (!cancelled) setDoc({ ...defaultBA(), ...d });
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Gagal memuat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, name]);

  // Auto-suggest nilai_ganti_rugi dari harga buku eksemplar terpilih.
  useEffect(() => {
    if (!doc.eksemplar) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await listResource<{ buku?: string }>("Eksemplar Buku", {
          fields: ["name", "buku"],
          filters: { name: doc.eksemplar },
          limit_page_length: 1,
        });
        const bukuName = rows[0]?.buku;
        if (!bukuName) return;
        const b = await listResource<{ harga_buku?: number }>("Buku", {
          fields: ["name", "harga_buku"],
          filters: { name: bukuName },
          limit_page_length: 1,
        });
        if (!cancelled) setBukuHarga(b[0]?.harga_buku ?? null);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc.eksemplar]);

  const isReadonly = (doc.docstatus ?? 0) >= 1;
  const photoRequired = doc.jenis_kerusakan === "Rusak Berat" || doc.jenis_kerusakan === "Hilang";

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadFoto(compressed);
      setDoc((p) => ({ ...p, foto: url }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (submit: boolean) => {
    if (!doc.tanggal_kejadian) return setErr("Tanggal wajib.");
    if (!doc.eksemplar) return setErr("Eksemplar wajib.");
    if (!doc.jenis_kerusakan) return setErr("Jenis kerusakan wajib.");
    if (photoRequired && !doc.foto) return setErr("Foto bukti wajib untuk jenis ini.");
    if (submit && !doc.keputusan) return setErr("Keputusan wajib sebelum approve.");
    setErr(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        tanggal_kejadian: doc.tanggal_kejadian,
        eksemplar: doc.eksemplar,
        pelapor: doc.pelapor,
        jenis_kerusakan: doc.jenis_kerusakan,
        keputusan: doc.keputusan,
        nilai_ganti_rugi: Number(doc.nilai_ganti_rugi) || 0,
        deskripsi: doc.deskripsi,
        foto: doc.foto,
        catatan_keputusan: doc.catatan_keputusan,
      };
      if (submit) payload.docstatus = 1;
      let savedName = name;
      if (isNew) {
        const c = await createResource<{ name: string }>("Berita Acara Kerusakan Buku", payload);
        savedName = c.name;
      } else {
        await updateResource("Berita Acara Kerusakan Buku", name, payload);
      }
      navigate({ to: "/$sekolah/perpustakaan/inventaris/berita-acara/$name", params: { sekolah, name: savedName } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const suggestedRugi = useMemo(() => bukuHarga ?? 0, [bukuHarga]);

  if (loading) return <div className="p-6 text-sm text-muted-fg">Memuat...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Perpustakaan / Inventaris / BA Kerusakan"
        title={isNew ? "BA Kerusakan Baru" : name}
        description={
          isReadonly
            ? "BA sudah di-approve. Side-effect ke Eksemplar sudah diterapkan."
            : "Lengkapi data insiden. Foto bukti wajib untuk Rusak Berat / Hilang."
        }
      />

      {err ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      <SectionCard title="Identitas Insiden">
        <FormGrid cols={3}>
          <FormField label="Tanggal Kejadian" htmlFor="tgl" required>
            <Input id="tgl" type="date" value={doc.tanggal_kejadian} disabled={isReadonly}
              onChange={(e) => setDoc((p) => ({ ...p, tanggal_kejadian: e.target.value }))} />
          </FormField>
          <FormField label="Eksemplar" htmlFor="eks" required>
            <SearchableSelect
              value={doc.eksemplar}
              disabled={isReadonly}
              onChange={(v) => setDoc((p) => ({ ...p, eksemplar: v }))}
              loadOptions={searchEksemplar}
              resolveLabel={async (v) => v}
              placeholder="Cari nomor inventaris…"
            />
          </FormField>
          <FormField label="Pelapor" htmlFor="pelapor">
            <SearchableSelect
              value={doc.pelapor}
              disabled={isReadonly}
              onChange={(v) => setDoc((p) => ({ ...p, pelapor: v }))}
              loadOptions={async (q) => {
                const f = q ? { or_filters: [["name", "like", `%${q}%`], ["full_name", "like", `%${q}%`]] as [string, string, unknown][] } : {};
                const rows = await listResource<{ name: string; full_name?: string }>("User", {
                  fields: ["name", "full_name"], ...f, limit_page_length: 20,
                });
                return rows.map((r) => ({ value: r.name, label: r.full_name ?? r.name }));
              }}
              resolveLabel={async (v) => v}
              placeholder="Cari user…"
            />
          </FormField>
          <FormField label="Jenis Kerusakan" htmlFor="jenis" required>
            <Select id="jenis" value={doc.jenis_kerusakan} disabled={isReadonly}
              onChange={(e) => setDoc((p) => ({ ...p, jenis_kerusakan: e.target.value as BA["jenis_kerusakan"] }))}>
              <option value="">— Pilih —</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
              <option value="Hilang">Hilang</option>
            </Select>
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard title="Detail Kejadian">
        <FormField label="Deskripsi Kerusakan" htmlFor="desk">
          <Textarea id="desk" value={doc.deskripsi} disabled={isReadonly} rows={4}
            onChange={(e) => setDoc((p) => ({ ...p, deskripsi: e.target.value }))} />
        </FormField>
        <div className="mt-4">
          <label className="mb-1 block text-xs text-muted-fg">
            Foto Bukti {photoRequired ? <span className="text-rose-600">*</span> : null}
          </label>
          {doc.foto ? (
            <div className="flex items-start gap-3">
              <img src={doc.foto} alt="Bukti" className="h-32 w-32 rounded-md border border-border object-cover" />
              {!isReadonly ? (
                <button type="button" onClick={() => setDoc((p) => ({ ...p, foto: "" }))}
                  className="text-xs text-rose-600 hover:underline">
                  Hapus foto
                </button>
              ) : null}
            </div>
          ) : !isReadonly ? (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
              className="block w-full text-sm text-fg file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-white"
            />
          ) : (
            <span className="text-xs text-muted-fg">— tidak ada foto —</span>
          )}
          {uploading ? <div className="mt-1 text-xs text-muted-fg">Mengunggah...</div> : null}
        </div>
      </SectionCard>

      <SectionCard title="Keputusan" description="Diputuskan oleh Kepala Perpustakaan saat approve.">
        <FormGrid cols={2}>
          <FormField label="Keputusan" htmlFor="keputusan">
            <Select id="keputusan" value={doc.keputusan} disabled={isReadonly}
              onChange={(e) => setDoc((p) => ({ ...p, keputusan: e.target.value as BA["keputusan"] }))}>
              <option value="">— Belum diputuskan —</option>
              <option value="Diperbaiki">Diperbaiki</option>
              <option value="Hapus">Hapus (eksemplar arsip)</option>
              <option value="Ganti Rugi">Ganti Rugi</option>
            </Select>
          </FormField>
          <FormField label="Nilai Ganti Rugi (Rp)" htmlFor="rugi"
            hint={suggestedRugi > 0 ? `Saran (harga buku): Rp ${suggestedRugi.toLocaleString("id-ID")}` : undefined}>
            <Input id="rugi" type="number" min={0} value={String(doc.nilai_ganti_rugi)}
              disabled={isReadonly || doc.keputusan !== "Ganti Rugi"}
              onChange={(e) => setDoc((p) => ({ ...p, nilai_ganti_rugi: Number(e.target.value) }))} />
          </FormField>
        </FormGrid>
        <FormField label="Catatan Keputusan" htmlFor="catkep">
          <Textarea id="catkep" value={doc.catatan_keputusan} disabled={isReadonly} rows={2}
            onChange={(e) => setDoc((p) => ({ ...p, catatan_keputusan: e.target.value }))} />
        </FormField>
      </SectionCard>

      {isReadonly ? (
        <div className="flex items-center justify-between rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <span className="h-4 w-4"><IconCheck /></span>
            BA approved — keputusan <Badge tone="success" dot>{doc.keputusan}</Badge> sudah diterapkan ke eksemplar.
          </div>
          <Button variant="outline" onClick={() => navigate({ to: "/$sekolah/perpustakaan/inventaris/berita-acara", params: { sekolah } })}>
            Kembali
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/$sekolah/perpustakaan/inventaris/berita-acara", params: { sekolah } })}>
            Kembali
          </Button>
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>
            Simpan Draft
          </Button>
          <Button onClick={() => save(true)} disabled={saving || !doc.keputusan}>
            Approve (Submit)
          </Button>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/perpustakaan/inventaris/berita-acara/$name")({ component: BADetailPage });
