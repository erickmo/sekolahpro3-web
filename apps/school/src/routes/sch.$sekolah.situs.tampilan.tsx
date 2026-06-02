import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  Card,
  FormField,
  Input,
  PageHeader,
  Switch,
  Textarea,
} from "@sekolahpro/ui";
import { useSitus, useSaveSitus, useTemplates, type SitusDoc } from "../data/situs";

const TOGGLES: { name: keyof SitusDoc; label: string }[] = [
  { name: "tampilkan_berita", label: "Berita" },
  { name: "tampilkan_agenda", label: "Agenda" },
  { name: "tampilkan_galeri", label: "Galeri" },
  { name: "tampilkan_prestasi", label: "Prestasi" },
  { name: "tampilkan_fasilitas", label: "Fasilitas" },
  { name: "tampilkan_sambutan", label: "Sambutan Kepsek" },
  { name: "tampilkan_ppdb", label: "PPDB" },
];

function TampilanCms() {
  const { sekolah } = Route.useParams();
  const { data } = useSitus(sekolah);
  const templates = useTemplates();
  const save = useSaveSitus(sekolah);
  const [form, setForm] = useState<Partial<SitusDoc>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = (k: keyof SitusDoc, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const str = (k: keyof SitusDoc) => (form[k] == null ? "" : String(form[k]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tampilan Situs"
        description="Pilih template, atur warna brand, dan tentukan bagian yang tampil."
        actions={
          <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan Perubahan"}
          </Button>
        }
      />

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Template</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {(templates.data ?? []).map((t) => {
            const active = form.template === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => set("template", t.key)}
                className={`rounded-xl border p-4 text-left transition ${active ? "border-brand ring-2 ring-brand/30" : "border-slate-200 hover:border-slate-300"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{t.nama}</span>
                  {active ? <span className="text-xs font-semibold text-brand">Dipilih</span> : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">{t.deskripsi}</p>
              </button>
            );
          })}
          {templates.data?.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada template tersedia.</p>
          ) : null}
        </div>
      </section>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold text-slate-700">Brand</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Warna Utama">
            <Input type="color" value={str("brand_color") || "#1d4ed8"} onChange={(e) => set("brand_color", e.target.value)} />
          </FormField>
          <FormField label="Warna Aksen">
            <Input type="color" value={str("brand_color_2") || "#f59e0b"} onChange={(e) => set("brand_color_2", e.target.value)} />
          </FormField>
          <FormField label="Logo (URL)">
            <Input value={str("logo")} onChange={(e) => set("logo", e.target.value)} />
          </FormField>
          <FormField label="Gambar Hero (URL)">
            <Input value={str("hero_image")} onChange={(e) => set("hero_image", e.target.value)} />
          </FormField>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold text-slate-700">Konten Beranda</h3>
        <FormField label="Tagline">
          <Input value={str("tagline")} onChange={(e) => set("tagline", e.target.value)} />
        </FormField>
        <FormField label="Judul Hero">
          <Input value={str("hero_judul")} onChange={(e) => set("hero_judul", e.target.value)} />
        </FormField>
        <FormField label="Subjudul Hero">
          <Textarea rows={2} value={str("hero_subjudul")} onChange={(e) => set("hero_subjudul", e.target.value)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Visi">
            <Textarea rows={3} value={str("visi")} onChange={(e) => set("visi", e.target.value)} />
          </FormField>
          <FormField label="Misi (HTML)">
            <Textarea rows={3} value={str("misi")} onChange={(e) => set("misi", e.target.value)} />
          </FormField>
        </div>
        <FormField label="Sambutan Kepala Sekolah (HTML)">
          <Textarea rows={3} value={str("sambutan_kepsek")} onChange={(e) => set("sambutan_kepsek", e.target.value)} />
        </FormField>
        <FormField label="Nama Kepala Sekolah">
          <Input value={str("nama_kepsek")} onChange={(e) => set("nama_kepsek", e.target.value)} />
        </FormField>
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="text-sm font-semibold text-slate-700">Bagian yang Tampil</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {TOGGLES.map((t) => (
            <Switch
              key={t.name}
              checked={Boolean(form[t.name])}
              onChange={(next) => set(t.name, next ? 1 : 0)}
              label={t.label}
            />
          ))}
        </div>
        {save.isError ? <p className="text-sm text-rose-600">Gagal menyimpan perubahan.</p> : null}
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/situs/tampilan")({ component: TampilanCms });
