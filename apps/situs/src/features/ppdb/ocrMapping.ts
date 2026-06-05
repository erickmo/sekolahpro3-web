/** Map a parsed KTP dict to the situs PPDB form (flat) applicant keys. */
type Parsed = Record<string, unknown>;

function str(p: Parsed, k: string): string | undefined {
  const v = p[k];
  return typeof v === "string" && v ? v : undefined;
}

const KTP_TO_FORM: Record<string, string> = {
  nik: "nik",
  nama: "nama_lengkap",
  jenis_kelamin: "jenis_kelamin",
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
  return out;
}
