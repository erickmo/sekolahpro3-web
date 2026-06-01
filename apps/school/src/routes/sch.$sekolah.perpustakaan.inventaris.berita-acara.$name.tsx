/**
 * BA Kerusakan Buku — detail (create / edit / approve).
 *
 * Pustakawan: input + upload foto + save Draft.
 * Kepala Perpustakaan: review + pilih keputusan + Submit (docstatus=1).
 * Side-effect per keputusan diterapkan backend on_submit. Lihat PERP-ADR-0006.
 */
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Badge, Button, IconCheck, PageHeader } from "@sekolahpro/ui";
import {
  createResource,
  getResource,
  listResource,
  updateResource,
} from "@sekolahpro/api-client";
import {
  BeritaAcaraForm,
  defaultBA,
  type BA,
} from "../components/perpustakaan/BeritaAcaraForm";

const BA_DOCTYPE = "Berita Acara Kerusakan Buku";
/** docstatus value Frappe assigns to a submitted (locked) document. */
const DOCSTATUS_SUBMITTED = 1;

function BADetailPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const { name } = useParams({ from: "/sch/$sekolah/perpustakaan/inventaris/berita-acara/$name" });
  const navigate = useNavigate();
  const isNew = name === "new";

  const [doc, setDoc] = useState<BA>(() => defaultBA());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [bukuHarga, setBukuHarga] = useState<number | null>(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await getResource<BA>(BA_DOCTYPE, name);
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

  const isReadonly = (doc.docstatus ?? 0) >= DOCSTATUS_SUBMITTED;
  const photoRequired = doc.jenis_kerusakan === "Rusak Berat" || doc.jenis_kerusakan === "Hilang";

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
      if (submit) payload.docstatus = DOCSTATUS_SUBMITTED;
      let savedName = name;
      if (isNew) {
        const c = await createResource<{ name: string }>(BA_DOCTYPE, payload);
        savedName = c.name;
      } else {
        await updateResource(BA_DOCTYPE, name, payload);
      }
      navigate({ to: "/sch/$sekolah/perpustakaan/inventaris/berita-acara/$name", params: { sekolah, name: savedName } });
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

      <BeritaAcaraForm
        doc={doc}
        set_doc={setDoc}
        is_readonly={isReadonly}
        photo_required={photoRequired}
        suggested_rugi={suggestedRugi}
        on_photo_error={(message) => setErr(message || null)}
      />

      {isReadonly ? (
        <div className="flex items-center justify-between rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <IconCheck className="h-4 w-4 shrink-0" />
            BA approved — keputusan <Badge tone="success" dot>{doc.keputusan}</Badge> sudah diterapkan ke eksemplar.
          </div>
          <Button variant="outline" onClick={() => navigate({ to: "/sch/$sekolah/perpustakaan/inventaris/berita-acara", params: { sekolah } })}>
            Kembali
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/sch/$sekolah/perpustakaan/inventaris/berita-acara", params: { sekolah } })}>
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

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/inventaris/berita-acara/$name")({ component: BADetailPage });
