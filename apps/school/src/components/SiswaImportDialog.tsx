import { useState } from "react";
import { Modal, Button, Badge, IconFile } from "@sekolahpro/ui";
import { useQueryClient } from "@tanstack/react-query";
import { createResource } from "@sekolahpro/api-client";
import { parseCsv } from "../lib/csv";
import { downloadCsv } from "../lib/stub";

// Importable Siswa fields. `key` is the Frappe fieldname (= CSV header), so an
// exported file round-trips back into import. `sekolah` is intentionally omitted;
// the backend attaches the active school on create (mirrors /siswa/new).
const FIELDS: Array<{ key: string; label: string; required: boolean }> = [
  { key: "nama_lengkap", label: "Nama Lengkap", required: true },
  { key: "jenis_kelamin", label: "Jenis Kelamin (Laki-laki/Perempuan)", required: true },
  { key: "tanggal_lahir", label: "Tanggal Lahir (YYYY-MM-DD)", required: true },
  { key: "tahun_masuk", label: "Tahun Masuk (Tahun Ajaran)", required: true },
  { key: "jenjang", label: "Jenjang (Unit Jenjang)", required: true },
  { key: "agama", label: "Agama", required: false },
  { key: "nisn", label: "NISN", required: false },
  { key: "nama_panggilan", label: "Nama Panggilan", required: false },
  { key: "tempat_lahir", label: "Tempat Lahir", required: false },
  { key: "alamat", label: "Alamat", required: false },
  { key: "asal_sekolah", label: "Asal Sekolah", required: false },
];

const REQUIRED = FIELDS.filter((f) => f.required).map((f) => f.key);
const JK = ["Laki-laki", "Perempuan"];

type Parsed = Record<string, string>;
type RowError = { row: number; msg: string };

function validateRow(r: Parsed): string | null {
  for (const k of REQUIRED) {
    if (!r[k]?.trim()) return `kolom wajib "${k}" kosong`;
  }
  if (r.jenis_kelamin && !JK.includes(r.jenis_kelamin)) {
    return `jenis_kelamin harus "Laki-laki" atau "Perempuan"`;
  }
  return null;
}

function buildDoc(r: Parsed): Record<string, unknown> {
  const doc: Record<string, unknown> = {};
  for (const f of FIELDS) {
    const v = r[f.key]?.trim();
    if (v) doc[f.key] = v;
  }
  return doc;
}

function downloadTemplate() {
  const example: Record<string, string> = {};
  FIELDS.forEach((f) => {
    example[f.key] = "";
  });
  example.nama_lengkap = "Budi Santoso";
  example.jenis_kelamin = "Laki-laki";
  example.tanggal_lahir = "2012-08-17";
  example.tahun_masuk = "2025/2026";
  example.jenjang = "SD";
  example.agama = "Islam";
  downloadCsv("template-import-siswa.csv", [example]);
}

export function SiswaImportDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Parsed[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ ok: number; errors: RowError[] } | null>(null);

  const invalidRows = rows
    .map((r, i) => ({ line: i + 2, err: validateRow(r) }))
    .filter((x) => x.err);
  const validCount = rows.length - invalidRows.length;

  function reset() {
    setRows([]);
    setParseError(null);
    setResult(null);
    setProgress({ done: 0, total: 0 });
  }

  function close() {
    if (importing) return;
    setOpen(false);
    reset();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    reset();
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length === 0) {
        setParseError("File kosong atau tidak ada baris data.");
        return;
      }
      setRows(parsed);
    } catch (err) {
      setParseError((err as Error).message);
    }
  }

  async function runImport() {
    const valid = rows.filter((r) => !validateRow(r));
    if (valid.length === 0) return;
    setImporting(true);
    setProgress({ done: 0, total: valid.length });
    const errors: RowError[] = [];
    let ok = 0;
    for (let i = 0; i < valid.length; i++) {
      try {
        await createResource("Siswa", buildDoc(valid[i]!));
        ok++;
      } catch (err) {
        errors.push({ row: i + 1, msg: (err as Error).message });
      }
      setProgress({ done: i + 1, total: valid.length });
    }
    qc.invalidateQueries({ queryKey: ["resource:list", "Siswa"] });
    setResult({ ok, errors });
    setImporting(false);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <span className="h-4 w-4 mr-1.5">
          <IconFile />
        </span>
        Import
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Import Data Siswa"
        description="Unggah file CSV. Unduh template agar kolom sesuai format."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={close} disabled={importing}>
              {result ? "Tutup" : "Batal"}
            </Button>
            {!result ? (
              <Button onClick={runImport} disabled={importing || validCount === 0}>
                {importing
                  ? `Mengimpor ${progress.done}/${progress.total}...`
                  : `Import ${validCount} siswa`}
              </Button>
            ) : null}
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              Unduh Template CSV
            </Button>
            <label className="inline-flex">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={onFile}
                disabled={importing}
                className="block text-sm text-muted-fg file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-sm file:text-fg hover:file:bg-muted/70"
              />
            </label>
          </div>

          {parseError ? <Badge tone="danger">{parseError}</Badge> : null}

          {rows.length > 0 && !result ? (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{rows.length} baris terbaca</Badge>
                <Badge tone="success">{validCount} valid</Badge>
                {invalidRows.length ? (
                  <Badge tone="warning">{invalidRows.length} dilewati</Badge>
                ) : null}
              </div>
              {invalidRows.length ? (
                <ul className="max-h-40 overflow-y-auto rounded-md border border-border p-2 text-xs text-muted-fg">
                  {invalidRows.map((x) => (
                    <li key={x.line}>
                      Baris {x.line}: {x.err}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {result ? (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge tone="success">{result.ok} berhasil</Badge>
                {result.errors.length ? (
                  <Badge tone="danger">{result.errors.length} gagal</Badge>
                ) : null}
              </div>
              {result.errors.length ? (
                <ul className="max-h-40 overflow-y-auto rounded-md border border-border p-2 text-xs text-muted-fg">
                  {result.errors.map((er) => (
                    <li key={er.row}>
                      Baris {er.row}: {er.msg}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
