/** Map a parsed KTP dict to the situs PPDB form (flat) applicant keys. */
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

const KTP_TO_FORM: Record<string, string> = {
  nik: "nik",
  nama: "nama_lengkap",
  tempat_lahir: "tempat_lahir",
  tanggal_lahir: "tanggal_lahir",
  alamat: "alamat",
};

/** Returns flat form-key -> value map (only present fields). */
export function mapKtpToCalon(p: Parsed): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [from, to] of Object.entries(KTP_TO_FORM)) {
    const v = str(p, from);
    if (v) out[to] = v;
  }
  const jk = genderCode(str(p, "jenis_kelamin"));
  if (jk) out["jenis_kelamin"] = jk;
  return out;
}
