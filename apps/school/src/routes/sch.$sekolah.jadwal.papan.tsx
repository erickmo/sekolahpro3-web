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
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

interface RombelRow {
  name: string;
  nama_rombel?: string;
}
interface SlotRow {
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  mata_pelajaran?: string | null;
  guru?: string | null;
  tipe?: string;
}
interface JadwalDoc {
  name: string;
  slots?: SlotRow[];
}

/** Stable key for a time band (jam_mulai..jam_selesai). */
function bandKey(s: { jam_mulai: string; jam_selesai: string }): string {
  return `${s.jam_mulai}|${s.jam_selesai}`;
}

function PapanSusunPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const [rombel, setRombel] = useState<string>("");

  const rombelQ = useResourceList<RombelRow>("Rombongan Belajar", {
    fields: ["name", "nama_rombel"],
    limit_page_length: 0,
  });
  const rombelList = rombelQ.data ?? [];
  const activeRombel = rombel || rombelList[0]?.name || "";

  const jadwalQ = useResourceList<{ name: string }>("Jadwal Pelajaran", {
    fields: ["name"],
    filters: activeRombel ? { rombel: activeRombel, is_aktif: 1 } : { name: ["=", "__none__"] },
    limit_page_length: 1,
  });
  const jadwalName = jadwalQ.data?.[0]?.name;
  const docQ = useResourceDoc<JadwalDoc>("Jadwal Pelajaran", jadwalName);
  const slots = useMemo(() => docQ.data?.slots ?? [], [docQ.data]);

  const bands = useMemo(() => {
    const seen = new Map<string, { jam_mulai: string; jam_selesai: string }>();
    for (const s of slots) seen.set(bandKey(s), { jam_mulai: s.jam_mulai, jam_selesai: s.jam_selesai });
    return [...seen.values()].sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
  }, [slots]);

  const cellOf = (hari: string, band: { jam_mulai: string; jam_selesai: string }) =>
    slots.find((s) => s.hari === hari && bandKey(s) === bandKey(band));

  const tanpaGuru = slots.filter((s) => !s.guru).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jadwal"
        title="Papan Susun"
        description="Grid jadwal mingguan per rombel — pantau cakupan dan lubang sebelum diterbitkan."
        actions={
          <Link to="/sch/$sekolah/jadwal/daftar" params={{ sekolah }}>
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconCalendar /></span>
              Edit Jadwal
            </Button>
          </Link>
        }
      />

      <PageGuide
        storageNamespace="jadwal-guide:"
        storageId="papan-susun"
        title="Cara pakai Papan Susun"
        intro="Pilih rombel untuk melihat grid mingguannya. Sel merah = slot tanpa guru."
        steps={[
          { title: "Pilih rombel", detail: "Gunakan pemilih rombel di bawah judul.", roles: ["tata_usaha", "operator"] },
          { title: "Baca grid", detail: "Baris = jam, kolom = hari. Sel merah perlu guru.", roles: ["tata_usaha"] },
          { title: "Perbaiki", detail: "Buka Edit Jadwal untuk mengisi atau memperbaiki slot.", roles: ["tata_usaha"] },
        ]}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-fg">Rombel</span>
          <select
            value={activeRombel}
            onChange={(e) => setRombel(e.target.value)}
            className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-fg min-w-[12rem]"
          >
            {rombelList.map((r) => (
              <option key={r.name} value={r.name}>
                {r.nama_rombel ?? r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Slot"
          value={docQ.isLoading ? "…" : slots.length}
          hint="pada jadwal aktif"
          icon={<IconBook />}
          accent="brand"
          urgency="normal"
        />
        <StatCard
          label="Slot Tanpa Guru"
          value={docQ.isLoading ? "…" : tanpaGuru}
          hint="perlu ditugaskan"
          icon={<IconBook />}
          accent={tanpaGuru === 0 ? "emerald" : "rose"}
          urgency={tanpaGuru === 0 ? "normal" : "critical"}
        />
      </div>

      <SectionCard title="Grid Mingguan" description={jadwalName ? `Jadwal ${jadwalName}` : "Tidak ada jadwal aktif"} padded={false}>
        {docQ.isLoading ? (
          <div className="px-5 py-6 text-sm text-muted-fg">Memuat…</div>
        ) : !jadwalName ? (
          <div className="px-5 py-8 text-center text-sm text-muted-fg">
            Belum ada jadwal aktif untuk rombel ini.
          </div>
        ) : bands.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-fg">Jadwal belum punya slot.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-fg">
                  <th className="px-3 py-2 text-left font-medium">Jam</th>
                  {HARI.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bands.map((band) => (
                  <tr key={bandKey(band)} className="border-b border-border/60">
                    <td className="px-3 py-2 text-xs font-semibold text-brand tabular-nums whitespace-nowrap">
                      {band.jam_mulai}–{band.jam_selesai}
                    </td>
                    {HARI.map((h) => {
                      const c = cellOf(h, band);
                      if (!c) return <td key={h} className="px-3 py-2 text-muted-fg/40">—</td>;
                      const tanpa = !c.guru;
                      return (
                        <td key={h} className={`px-3 py-2 ${tanpa ? "bg-rose-500/10" : ""}`}>
                          <div className="text-fg truncate">{c.mata_pelajaran ?? "—"}</div>
                          <div className="text-xs text-muted-fg truncate">
                            {c.guru ?? <span className="text-rose-600">tanpa guru</span>}
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

      {tanpaGuru > 0 && (
        <Badge tone="warning">{tanpaGuru} slot tanpa guru — lengkapi sebelum menerbitkan jadwal.</Badge>
      )}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal/papan")({ component: PapanSusunPage });
