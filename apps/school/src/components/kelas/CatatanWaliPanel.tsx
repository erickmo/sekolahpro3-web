/**
 * CatatanWaliPanel — the Wali Kelas quick-notes store in the "Kelasku" cockpit.
 * Lists recent Catatan Wali for the class and adds a note (siswa + kategori +
 * isi) via the Catatan Wali doctype. This is the persistent home for the
 * homeroom relationship work the JTBD says the wali owns.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { frappeFetch, useResourceList } from "@sekolahpro/api-client";
import { SectionCard, Badge, Button } from "@sekolahpro/ui";

const CATATAN_DOCTYPE = "Catatan Wali";
const KATEGORI = ["Umum", "Kontak", "Akademik", "Perilaku"] as const;

interface CatatanRow {
  name: string;
  siswa: string;
  kategori?: string;
  isi?: string;
  tanggal?: string;
}

export interface CatatanWaliPanelProps {
  rombel: string;
  sekolah: string;
  /** Roster siswa ids for the add-note picker. */
  siswaOptions: readonly string[];
}

export function CatatanWaliPanel({ rombel, sekolah, siswaOptions }: CatatanWaliPanelProps) {
  const qc = useQueryClient();
  const list = useResourceList<CatatanRow>(CATATAN_DOCTYPE, {
    fields: ["name", "siswa", "kategori", "isi", "tanggal"],
    filters: [["rombel", "=", rombel]],
    order_by: "modified desc",
    limit_page_length: 10,
  });
  const notes = list.data ?? [];

  const [siswa, setSiswa] = useState("");
  const [kategori, setKategori] = useState<string>("Umum");
  const [isi, setIsi] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote() {
    if (!siswa || !isi.trim()) return;
    setSaving(true);
    try {
      await frappeFetch("frappe.client.insert", {
        doc: { doctype: CATATAN_DOCTYPE, siswa, rombel, sekolah, kategori, isi },
      });
      setIsi("");
      setSiswa("");
      qc.invalidateQueries({ queryKey: ["resource:list", CATATAN_DOCTYPE] });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "rounded-md border border-border bg-bg px-2 py-1.5 text-sm";

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <span>Catatan Wali</span>
          <Badge tone="neutral">{notes.length}</Badge>
        </span>
      }
      description="Catatan cepat per siswa (kontak, akademik, perilaku)."
    >
      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <select value={siswa} onChange={(e) => setSiswa(e.target.value)} className={inputCls}>
            <option value="">— pilih siswa —</option>
            {siswaOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={kategori} onChange={(e) => setKategori(e.target.value)} className={inputCls}>
            {KATEGORI.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <textarea
          value={isi}
          onChange={(e) => setIsi(e.target.value)}
          placeholder="Tulis catatan…"
          rows={2}
          className={`${inputCls} w-full`}
        />
        <div className="flex justify-end">
          <Button size="sm" disabled={!siswa || !isi.trim() || saving} onClick={addNote}>
            {saving ? "Menyimpan…" : "Simpan Catatan"}
          </Button>
        </div>
      </div>

      {notes.length > 0 ? (
        <ul className="mt-3 divide-y divide-border">
          {notes.map((n) => (
            <li key={n.name} className="py-2 text-sm">
              <span className="font-medium text-fg">{n.siswa}</span>
              <Badge tone="neutral" className="ml-2">{n.kategori ?? "Umum"}</Badge>
              <span className="ml-2 text-xs text-muted-fg">{n.tanggal}</span>
              <p className="mt-0.5 whitespace-pre-wrap text-fg/90">{n.isi}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </SectionCard>
  );
}
