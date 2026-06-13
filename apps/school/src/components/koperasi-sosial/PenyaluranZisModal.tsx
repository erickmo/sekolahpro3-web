import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  FormField,
  Input,
  Modal,
  SearchableSelect,
} from "@sekolahpro/ui";
import {
  getResource,
  humanizeFrappeError,
  useResourceCreate,
  useResourceList,
} from "@sekolahpro/api-client";
import { FormSection } from "../shared/FormSection";
import { DynamicLinkPicker, type DynamicLinkOption } from "../shared/DynamicLinkPicker";

const DOCTYPE = "Penyaluran ZIS";

// Exact backend asnaf Select values (8 golongan penerima zakat).
const ASNAF_OPTIONS = [
  "Fakir",
  "Miskin",
  "Amil",
  "Mualaf",
  "Riqab",
  "Gharimin",
  "Fi Sabilillah",
  "Ibnu Sabil",
] as const;

// Penerima manfaat boleh orang mana pun di sistem; opsional.
const PENERIMA_TIPE_OPTIONS: ReadonlyArray<DynamicLinkOption> = [
  { doctype: "Siswa", label: "Siswa", labelField: "nama_lengkap" },
  { doctype: "Pegawai", label: "Pegawai", labelField: "nama_lengkap" },
  { doctype: "User", label: "User Sistem", labelField: "full_name" },
];

const MIN_YEAR = new Date().getFullYear() - 5;
const MAX_YEAR = new Date().getFullYear() + 1;

interface ProgramRow {
  name: string;
  jenis_dana?: string;
  terkumpul?: number;
  tersalurkan?: number;
  status?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (name: string) => void;
}

/**
 * Catat Penyaluran ZIS. Backend contract (penyaluran_zis.json + controller):
 * { program_penyaluran*, jumlah*, tanggal*, asnaf (WAJIB bila kategori jenis
 * dana program = Zakat), penerima_tipe?+penerima? }. Program harus Aktif dan
 * jumlah ≤ sisa dana program — keduanya juga divalidasi server.
 */
export function PenyaluranZisModal({ open, onClose, onCreated }: Props) {
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(DOCTYPE);
  const today = new Date().toISOString().slice(0, 10);
  const [program, setProgram] = useState("");
  const [asnaf, setAsnaf] = useState("");
  const [penerimaTipe, setPenerimaTipe] = useState("");
  const [penerima, setPenerima] = useState("");
  const [tanggal, setTanggal] = useState(today);
  const [kategori, setKategori] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Program Aktif saja yang bisa menyalurkan dana.
  const programQ = useResourceList<ProgramRow>("Program Penyaluran", {
    fields: ["name", "jenis_dana", "terkumpul", "tersalurkan", "status"],
    filters: [["status", "=", "Aktif"]],
    order_by: "name asc",
    limit_page_length: 50,
  });
  const programs = programQ.data ?? [];
  const picked = useMemo(() => programs.find((p) => p.name === program), [programs, program]);
  const sisa = picked ? (picked.terkumpul ?? 0) - (picked.tersalurkan ?? 0) : null;

  // 2-hop: kategori jenis dana program menentukan wajib/tidaknya asnaf.
  const jenisDana = picked?.jenis_dana ?? "";
  useEffect(() => {
    let cancelled = false;
    setKategori(null);
    if (!jenisDana) return;
    void getResource<{ kategori?: string }>("Jenis Dana ZIS", jenisDana)
      .then((d) => {
        if (!cancelled) setKategori(d.kategori ?? null);
      })
      .catch(() => {
        if (!cancelled) setKategori(null);
      });
    return () => {
      cancelled = true;
    };
  }, [jenisDana]);

  const asnafRequired = kategori === "Zakat";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const jumlah = Number(fd.get("jumlah"));
    const errs: Record<string, string> = {};
    if (!program) errs.program = "Wajib";
    if (!jumlah || jumlah <= 0) errs.jumlah = "Harus > 0";
    if (sisa !== null && jumlah > sisa + 1) errs.jumlah = `Melebihi sisa dana program (Rp ${sisa.toLocaleString("id-ID")})`;
    if (asnafRequired && !asnaf) errs.asnaf = "Wajib untuk dana Zakat";
    if (penerimaTipe && !penerima) errs.penerima = "Pilih penerimanya";
    if (Object.keys(errs).length) { setErr(errs); return; }
    setErr({});
    setError(null);
    const payload: Record<string, unknown> = {
      program_penyaluran: program,
      jumlah,
      tanggal,
    };
    if (asnaf) payload["asnaf"] = asnaf;
    if (penerimaTipe && penerima) {
      payload["penerima_tipe"] = penerimaTipe;
      payload["penerima"] = penerima;
    }
    create.mutate(payload, {
      onSuccess: (doc) => {
        void qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
        void qc.invalidateQueries({ queryKey: ["resource:list", "Program Penyaluran"] });
        onCreated?.(doc.name);
        onClose();
      },
      onError: (e2) =>
        setError(humanizeFrappeError(e2) ?? (e2 instanceof Error ? e2.message : "Gagal mencatat penyaluran")),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Catat Penyaluran ZIS"
      description="Salurkan dana sosial dari program aktif. Tanda * wajib diisi."
      size="mega"
      tone="brand"
    >
      <form onSubmit={submit} className="space-y-5">
        <FormSection
          title="Program & Nominal"
          description="Dana keluar selalu menempel ke satu program penyaluran."
        >
          <FormField
            label="Program Penyaluran"
            required
            error={err.program}
            {...(picked && sisa !== null
              ? { hint: `Sisa dana: Rp ${sisa.toLocaleString("id-ID")}${kategori ? ` · kategori ${kategori}` : ""}` }
              : {})}
          >
            <SearchableSelect
              value={program}
              onChange={(v) => {
                setProgram(v);
                setAsnaf("");
              }}
              options={programs.map((p) => ({ value: p.name, label: p.name }))}
              placeholder={programQ.isLoading ? "Memuat program…" : "— pilih program aktif —"}
            />
          </FormField>
          <FormField label="Nominal (Rp)" required error={err.jumlah}>
            <Input name="jumlah" type="number" min={1} step="1" required placeholder="0" />
          </FormField>
          <FormField label="Tanggal" required>
            <DatePicker
              value={tanggal}
              onChange={setTanggal}
              required
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField
            label="Asnaf"
            {...(asnafRequired ? { required: true } : {})}
            error={err.asnaf}
            hint={asnafRequired ? "Wajib — program ini dana Zakat. Amil maks 12,5%." : "Opsional untuk dana non-zakat."}
          >
            <SearchableSelect
              value={asnaf}
              onChange={setAsnaf}
              options={ASNAF_OPTIONS.map((a) => ({ value: a, label: a }))}
              placeholder="— pilih golongan —"
            />
          </FormField>
        </FormSection>
        <FormSection
          title="Penerima (Opsional)"
          description="Kosongkan untuk penyaluran kolektif tanpa penerima tunggal."
        >
          <DynamicLinkPicker
            options={PENERIMA_TIPE_OPTIONS}
            doctype={penerimaTipe}
            onDoctypeChange={setPenerimaTipe}
            value={penerima}
            onValueChange={setPenerima}
            typeLabel="Tipe Penerima"
            valueLabel="Penerima"
            valueError={err.penerima}
          />
        </FormSection>
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Memproses..." : "Simpan Penyaluran"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
