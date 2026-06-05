/** Map a parsed KTP dict to PPDB wizard applicant (calon.*) field paths. */
type Parsed = Record<string, unknown>;

function str(p: Parsed, k: string): string | undefined {
  const v = p[k];
  return typeof v === "string" && v ? v : undefined;
}

const KTP_TO_CALON: Record<string, string> = {
  nik: "calon.nik",
  nama: "calon.nama_lengkap",
  jenis_kelamin: "calon.jenis_kelamin",
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
  return out;
}
