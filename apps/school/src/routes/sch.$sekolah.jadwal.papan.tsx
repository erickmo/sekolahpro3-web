import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  PageHeader,
  SectionCard,
  StatCard,
  IconBook,
  IconCalendar,
} from "@sekolahpro/ui";
import {
  useFrappeMutation,
  useResourceDoc,
  useResourceList,
  useResourceUpdate,
} from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";
import { JADWAL_ACTIONS, useJadwalTransition } from "../components/jadwal-extra/workflowActions";
import {
  bandKey,
  bandsFromSlots,
  bolehTerbitkan,
  slotsTanpaGuru,
  tanpaSlot,
  withTambahanSlot,
  type PapanSlot,
} from "../lib/jadwalPapan";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
const METHOD_CEK = "sekolahpro.akademik.api.jadwal.cek_bentrok_guru";

interface RombelRow {
  name: string;
  nama_rombel?: string;
}
interface NamedRow {
  name: string;
}
interface JadwalDoc {
  name: string;
  tahun_ajaran?: string;
  semester?: string;
  workflow_state?: string;
  slots?: PapanSlot[];
}

interface BlankForm {
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  mapel: string;
  guru: string;
  ruangan: string;
}
const FORM_KOSONG: BlankForm = { hari: "Senin", jam_mulai: "07:00:00", jam_selesai: "08:00:00", mapel: "", guru: "", ruangan: "" };

function PapanSusunPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const [rombel, setRombel] = useState<string>("");
  const [form, setForm] = useState<BlankForm>(FORM_KOSONG);
  const [msg, setMsg] = useState<string | null>(null);
  const [salinan, setSalinan] = useState<Pick<PapanSlot, "mata_pelajaran" | "guru" | "ruangan"> | null>(null);

  const rombelQ = useResourceList<RombelRow>("Rombongan Belajar", { fields: ["name", "nama_rombel"], limit_page_length: 0 });
  const rombelList = rombelQ.data ?? [];
  const activeRombel = rombel || rombelList[0]?.name || "";

  const jadwalQ = useResourceList<NamedRow>("Jadwal Pelajaran", {
    fields: ["name"],
    filters: activeRombel ? { rombel: activeRombel, is_aktif: 1 } : { name: ["=", "__none__"] },
    limit_page_length: 1,
  });
  const jadwalName = jadwalQ.data?.[0]?.name;
  const docQ = useResourceDoc<JadwalDoc>("Jadwal Pelajaran", jadwalName);
  const doc = docQ.data;
  const slots = useMemo(() => doc?.slots ?? [], [doc]);

  const mapelQ = useResourceList<NamedRow>("Mata Pelajaran", { fields: ["name"], limit_page_length: 0 });
  const guruQ = useResourceList<NamedRow>("Pegawai", { fields: ["name"], limit_page_length: 0 });
  const ruanganQ = useResourceList<NamedRow>("Ruangan", { fields: ["name"], limit_page_length: 0 });

  const cek = useFrappeMutation<Record<string, unknown>, { bentrok: boolean; info: string | null }>(METHOD_CEK);
  const update = useResourceUpdate<JadwalDoc>("Jadwal Pelajaran");
  const { transisi, isPending: transisiPending } = useJadwalTransition();
  const busy = cek.isPending || update.isPending || transisiPending;

  const bands = useMemo(() => bandsFromSlots(slots), [slots]);
  const tanpaGuru = slotsTanpaGuru(slots);

  const set = (k: keyof BlankForm) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleTambah() {
    setMsg(null);
    if (!jadwalName || !doc) return;
    if (!form.mapel || !form.guru) {
      setMsg("Lengkapi mata pelajaran dan guru.");
      return;
    }
    try {
      const hasil = await cek.mutateAsync({
        guru: form.guru, hari: form.hari, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai,
        tahun_ajaran: doc.tahun_ajaran, semester: doc.semester, exclude: jadwalName,
      });
      if (hasil.bentrok) {
        setMsg(`Bentrok: ${hasil.info ?? "guru sudah terjadwal pada jam itu"}`);
        return;
      }
      const baru: PapanSlot = {
        hari: form.hari, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai,
        mata_pelajaran: form.mapel, guru: form.guru, ruangan: form.ruangan || null,
      };
      await update.mutateAsync({ name: jadwalName, patch: { slots: withTambahanSlot(slots, baru) } });
      setForm((f) => ({ ...f, mapel: "", guru: "", ruangan: "" }));
      docQ.refetch();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function handleHapus(index: number) {
    setMsg(null);
    if (!jadwalName) return;
    try {
      await update.mutateAsync({ name: jadwalName, patch: { slots: tanpaSlot(slots, index) } });
      docQ.refetch();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function handleTerbitkan() {
    setMsg(null);
    if (!jadwalName) return;
    try {
      await transisi(jadwalName, JADWAL_ACTIONS.ajukan);
      docQ.refetch();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  // Paste the copied slot's mapel/guru/ruangan into an empty cell (hari + band),
  // re-running the conflict check so a paste can never introduce a double-book.
  async function handleTempel(hari: string, jam_mulai: string, jam_selesai: string) {
    setMsg(null);
    if (!jadwalName || !doc || !salinan) return;
    try {
      if (salinan.guru) {
        const hasil = await cek.mutateAsync({
          guru: salinan.guru, hari, jam_mulai, jam_selesai,
          tahun_ajaran: doc.tahun_ajaran, semester: doc.semester, exclude: jadwalName,
        });
        if (hasil.bentrok) {
          setMsg(`Bentrok: ${hasil.info ?? "guru sudah terjadwal pada jam itu"}`);
          return;
        }
      }
      const baru: PapanSlot = {
        hari, jam_mulai, jam_selesai,
        mata_pelajaran: salinan.mata_pelajaran ?? null, guru: salinan.guru ?? null, ruangan: salinan.ruangan ?? null,
      };
      await update.mutateAsync({ name: jadwalName, patch: { slots: withTambahanSlot(slots, baru) } });
      docQ.refetch();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jadwal"
        title="Papan Susun"
        description="Susun jadwal mingguan per rombel: tambah slot, cek bentrok guru, lalu ajukan untuk diterbitkan."
        actions={
          <Link to="/sch/$sekolah/jadwal/daftar" params={{ sekolah }}>
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconCalendar /></span>
              Daftar Jadwal
            </Button>
          </Link>
        }
      />

      <PageGuide
        storageNamespace="jadwal-guide:"
        storageId="papan-susun"
        title="Cara pakai Papan Susun"
        intro="Pilih rombel, tambah slot (mapel + guru), perbaiki sel merah, lalu Ajukan saat lengkap."
        steps={[
          { title: "Pilih rombel", detail: "Grid menampilkan jadwal aktifnya.", roles: ["tata_usaha", "operator"] },
          { title: "Tambah slot", detail: "Isi hari/jam/mapel/guru; bentrok guru ditolak otomatis.", roles: ["tata_usaha"] },
          { title: "Ajukan", detail: "Tombol Ajukan aktif saat semua slot berguru.", roles: ["tata_usaha"] },
        ]}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-fg">Rombel</span>
          <select value={activeRombel} onChange={(e) => setRombel(e.target.value)}
            className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-fg min-w-[12rem]">
            {rombelList.map((r) => <option key={r.name} value={r.name}>{r.nama_rombel ?? r.name}</option>)}
          </select>
        </label>
        {doc?.workflow_state && <Badge tone="neutral">Status: {doc.workflow_state}</Badge>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Slot" value={docQ.isLoading ? "…" : slots.length} hint="pada jadwal aktif" icon={<IconBook />} accent="brand" urgency="normal" />
        <StatCard label="Slot Tanpa Guru" value={docQ.isLoading ? "…" : tanpaGuru} hint="perlu ditugaskan" icon={<IconBook />} accent={tanpaGuru === 0 ? "emerald" : "rose"} urgency={tanpaGuru === 0 ? "normal" : "critical"} />
      </div>

      {msg && <Badge tone="danger">{msg}</Badge>}
      {salinan && (
        <div className="flex items-center gap-2 text-sm">
          <Badge tone="brand">Menyalin: {salinan.mata_pelajaran ?? "—"} · {salinan.guru ?? "tanpa guru"}</Badge>
          <button type="button" onClick={() => setSalinan(null)} className="text-xs text-muted-fg hover:text-fg underline">
            batal salin
          </button>
          <span className="text-xs text-muted-fg">— klik Tempel pada sel kosong</span>
        </div>
      )}

      {jadwalName && (
        <SectionCard title="Tambah Slot" description="Bentrok guru dicek sebelum disimpan.">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm"><span className="text-muted-fg">Hari</span>
              <select value={form.hari} onChange={set("hari")} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm">
                {HARI.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm"><span className="text-muted-fg">Mulai</span>
              <input type="time" step={60} value={form.jam_mulai.slice(0, 5)} onChange={(e) => setForm((f) => ({ ...f, jam_mulai: `${e.target.value}:00` }))} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-sm"><span className="text-muted-fg">Selesai</span>
              <input type="time" step={60} value={form.jam_selesai.slice(0, 5)} onChange={(e) => setForm((f) => ({ ...f, jam_selesai: `${e.target.value}:00` }))} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-sm"><span className="text-muted-fg">Mapel</span>
              <select value={form.mapel} onChange={set("mapel")} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm min-w-[10rem]">
                <option value="">— pilih —</option>
                {(mapelQ.data ?? []).map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm"><span className="text-muted-fg">Guru</span>
              <select value={form.guru} onChange={set("guru")} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm min-w-[10rem]">
                <option value="">— pilih —</option>
                {(guruQ.data ?? []).map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm"><span className="text-muted-fg">Ruangan</span>
              <select value={form.ruangan} onChange={set("ruangan")} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm min-w-[8rem]">
                <option value="">—</option>
                {(ruanganQ.data ?? []).map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
            </label>
            <Button onClick={handleTambah} disabled={busy}>{busy ? "…" : "Tambah"}</Button>
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Grid Mingguan"
        description={jadwalName ? `Jadwal ${jadwalName}` : "Tidak ada jadwal aktif"}
        padded={false}
        action={
          jadwalName ? (
            <Button onClick={handleTerbitkan} disabled={busy || !bolehTerbitkan(slots)}>
              Ajukan untuk Terbit
            </Button>
          ) : undefined
        }
      >
        {docQ.isLoading ? (
          <div className="px-5 py-6 text-sm text-muted-fg">Memuat…</div>
        ) : !jadwalName ? (
          <div className="px-5 py-8 text-center text-sm text-muted-fg">Belum ada jadwal aktif untuk rombel ini.</div>
        ) : bands.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-fg">Belum ada slot — tambah lewat form di atas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-fg">
                  <th className="px-3 py-2 text-left font-medium">Jam</th>
                  {HARI.map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {bands.map((band) => (
                  <tr key={bandKey(band)} className="border-b border-border/60">
                    <td className="px-3 py-2 text-xs font-semibold text-brand tabular-nums whitespace-nowrap">{band.jam_mulai}–{band.jam_selesai}</td>
                    {HARI.map((h) => {
                      const idx = slots.findIndex((s) => s.hari === h && bandKey(s) === bandKey(band));
                      const c = idx >= 0 ? slots[idx] : undefined;
                      if (!c) {
                        return (
                          <td key={h} className="px-3 py-2 text-muted-fg/40">
                            {salinan ? (
                              <button type="button" onClick={() => handleTempel(h, band.jam_mulai, band.jam_selesai)} disabled={busy}
                                className="text-brand hover:underline text-xs" aria-label="Tempel slot">Tempel</button>
                            ) : "—"}
                          </td>
                        );
                      }
                      return (
                        <td key={h} className={`px-3 py-2 ${!c.guru ? "bg-rose-500/10" : ""}`}>
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <div className="text-fg truncate">{c.mata_pelajaran ?? "—"}</div>
                              <div className="text-xs text-muted-fg truncate">{c.guru ?? <span className="text-rose-600">tanpa guru</span>}</div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-0.5">
                              <button type="button" onClick={() => handleHapus(idx)} disabled={busy}
                                className="text-muted-fg hover:text-rose-600 text-xs leading-none" aria-label="Hapus slot">×</button>
                              <button type="button" onClick={() => setSalinan({ mata_pelajaran: c.mata_pelajaran ?? null, guru: c.guru ?? null, ruangan: c.ruangan ?? null })}
                                className="text-muted-fg hover:text-brand text-[10px] leading-none" aria-label="Salin slot">salin</button>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal/papan")({ component: PapanSusunPage });
