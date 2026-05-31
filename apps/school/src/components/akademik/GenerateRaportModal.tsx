import { type ReactNode, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormField,
  FormGrid,
  Modal,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource, useFrappeMutation, FrappeError } from "@sekolahpro/api-client";

/** Heading section + grid untuk satu kelompok logis field. */
function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description ? <p className="text-xs text-muted-fg mt-0.5">{description}</p> : null}
      </div>
      <FormGrid cols={2}>{children}</FormGrid>
    </section>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional context preset (TA + semester) from akademik context bar. */
  initial?: { semester?: string; tahunAjaran?: string };
  onCreated?: (raportName: string) => void;
}

const SEMESTER_OPTIONS: SearchableOption[] = [
  { value: "Ganjil", label: "Ganjil" },
  { value: "Genap", label: "Genap" },
];

// Backend entrypoint — @frappe.whitelist di
// sekolahpro/akademik/doctype/raport/raport.py: generate_raport().
const METHOD = "sekolahpro.akademik.doctype.raport.raport.generate_raport";

async function loadSiswa(q: string): Promise<SearchableOption[]> {
  const filters: Array<[string, string, string]> = q
    ? [["nama_lengkap", "like", `%${q}%`]]
    : [];
  const rows = await listResource<{ name: string; nama_lengkap?: string; nis?: string }>(
    "Siswa",
    {
      fields: ["name", "nama_lengkap", "nis"],
      filters,
      order_by: "`nama_lengkap` asc",
      limit_page_length: 40,
    },
  );
  return rows.map((r): SearchableOption => {
    const opt: SearchableOption = { value: r.name, label: r.nama_lengkap ?? r.name };
    if (r.nis) opt.hint = `NIS ${r.nis}`;
    return opt;
  });
}

async function loadTA(q: string): Promise<SearchableOption[]> {
  const filters: Array<[string, string, string]> = q ? [["nama", "like", `%${q}%`]] : [];
  const rows = await listResource<{ name: string; nama?: string; is_current?: 0 | 1 }>(
    "Tahun Ajaran",
    {
      fields: ["name", "nama", "is_current"],
      filters,
      order_by: "`nama` desc",
      limit_page_length: 30,
    },
  );
  return rows.map((r): SearchableOption => {
    const opt: SearchableOption = { value: r.name, label: r.nama ?? r.name };
    if (r.is_current) opt.hint = "Berjalan";
    return opt;
  });
}

export function GenerateRaportModal({ open, onClose, initial, onCreated }: Props) {
  const qc = useQueryClient();
  const [siswa, setSiswa] = useState("");
  const [semester, setSemester] = useState(initial?.semester ?? "");
  const [tahunAjaran, setTahunAjaran] = useState(initial?.tahunAjaran ?? "");
  const [error, setError] = useState<string | null>(null);

  const mutation = useFrappeMutation<
    { siswa: string; semester: string; tahun_ajaran: string },
    { name: string }
  >(METHOD);

  const ready = siswa && semester && tahunAjaran && !mutation.isPending;

  const reset = () => {
    setSiswa("");
    setSemester(initial?.semester ?? "");
    setTahunAjaran(initial?.tahunAjaran ?? "");
    setError(null);
  };

  const close = () => {
    if (mutation.isPending) return;
    reset();
    onClose();
  };

  const submit = async () => {
    setError(null);
    if (!ready) {
      setError("Lengkapi siswa, semester, dan tahun ajaran.");
      return;
    }
    try {
      const result = await mutation.mutateAsync({
        siswa,
        semester,
        tahun_ajaran: tahunAjaran,
      });
      qc.invalidateQueries({ queryKey: ["resource:list", "Raport"] });
      onCreated?.(result?.name ?? "");
      reset();
      onClose();
    } catch (err) {
      const fe = err as FrappeError;
      const payload = (fe?.payload ?? {}) as { exception?: string; _server_messages?: string };
      const msg =
        payload.exception ??
        payload._server_messages ??
        (err as Error)?.message ??
        "Gagal generate raport.";
      setError(msg);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Generate Raport"
      description="Bangun draft raport dari seluruh Entri Nilai siswa pada semester & tahun ajaran terpilih."
      size="mega"
      tone="brand"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={mutation.isPending}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!ready}>
            {mutation.isPending ? "Memproses…" : "Generate"}
          </Button>
        </>
      }
    >
      <div className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
        Raport baru dibuat berstatus <strong>Draft</strong> lalu mengikuti alur Draft → Review →
        Submitted → Final → Locked/Tercetak. Generate ulang memperbarui draft dari Entri Nilai
        terkini.
      </div>
      <FormSection title="Sumber Data Raport" description="Tanda * wajib diisi.">
        <FormField label="Siswa" required className="col-span-2">
          <SearchableSelect
            value={siswa}
            onChange={setSiswa}
            loadOptions={loadSiswa}
            placeholder="Cari siswa…"
          />
        </FormField>
        <FormField label="Semester" required>
          <SearchableSelect
            value={semester}
            onChange={setSemester}
            options={SEMESTER_OPTIONS}
            placeholder="Pilih semester…"
          />
        </FormField>
        <FormField label="Tahun Ajaran" required>
          <SearchableSelect
            value={tahunAjaran}
            onChange={setTahunAjaran}
            loadOptions={loadTA}
            placeholder="Cari tahun ajaran…"
          />
        </FormField>
      </FormSection>
      {error ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}
    </Modal>
  );
}
