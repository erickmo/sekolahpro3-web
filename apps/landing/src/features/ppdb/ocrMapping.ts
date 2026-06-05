/** Map a parsed KTP dict to PPDB wizard applicant (calon.*) field paths. */
type Parsed = Record<string, unknown>;

function str(p: Parsed, k: string): string | undefined {
  const v = p[k];
  return typeof v === "string" && v ? v : undefined;
}

/** OCR gender ("Laki-laki"/"Perempuan") -> form enum code ("L"/"P"). Omits if unknown. */
function genderCode(v?: string): string | undefined {
  if (!v) return undefined;
  const low = v.toLowerCase();
  if (low.startsWith("laki")) return "L";
  if (low.startsWith("perempuan")) return "P";
  return undefined;
}

const KTP_TO_CALON: Record<string, string> = {
  nik: "calon.nik",
  nama: "calon.nama_lengkap",
  tempat_lahir: "calon.tempat_lahir",
  tanggal_lahir: "calon.tanggal_lahir",
  alamat: "calon.alamat",
};

/** Returns react-hook-form field-path -> value (only present fields). */
export function mapKtpToCalon(p: Parsed): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [from, to] of Object.entries(KTP_TO_CALON)) {
    const v = str(p, from);
    if (v) out[to] = v;
  }
  const jk = genderCode(str(p, "jenis_kelamin"));
  if (jk) out["calon.jenis_kelamin"] = jk;
  return out;
}
