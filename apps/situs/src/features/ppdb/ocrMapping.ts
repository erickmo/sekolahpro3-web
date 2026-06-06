/** Map a parsed KTP/KK dict to the situs PPDB form (flat) keys. */
type Parsed = Record<string, unknown>;

interface KkAnggota {
  nik: string;
  nama?: string;
  jenis_kelamin?: string;
  status_hubungan?: string;
}

function str(p: Parsed, k: string): string | undefined {
  const v = p[k];
  return typeof v === "string" && v ? v : undefined;
}

/** OCR gender ("Laki-laki"/"Perempuan") -> form enum code ("L"/"P"). Omits if unknown. */
export function genderCode(v?: string): string | undefined {
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

/**
 * Map a parsed Kartu Keluarga (KK) to the situs PPDB flat form keys.
 * Situs schema keys verified from schema.ts: nama_lengkap, nik, jenis_kelamin,
 * alamat, nama_ayah, nama_ibu.
 *
 * Heuristics (documented):
 *  - Applicant (calon) = first member whose status_hubungan contains "anak"
 *    (case-insensitive). If none found, calon fields are omitted entirely.
 *  - Ayah = member matching "kepala keluarga" AND male ("laki"), else "suami";
 *    fallback: any member matching "kepala keluarga" regardless of gender.
 *  - Ibu = first member matching "istri".
 *  - Address comes from the KK header field `alamat` (not from any anggota).
 *
 * Known limits:
 *  - Single-mother KK (no Suami/Kepala Keluarga male) → nama_ayah omitted.
 *  - Multiple "anak" entries: only the first is used as the applicant.
 *  - Missing status_hubungan on all members → calon fields omitted.
 */
export function mapKkToCalon(fields: Parsed): Record<string, string> {
  const out: Record<string, string> = {};

  const anggota = (fields["anggota"] as KkAnggota[] | undefined) ?? [];

  /** Find the first member whose status_hubungan contains the given keyword (case-insensitive). */
  function findMember(keyword: string): KkAnggota | undefined {
    return anggota.find((m) =>
      m.status_hubungan?.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  // ── Applicant ────────────────────────────────────────────────────────────
  const anak = findMember("anak");
  if (anak) {
    if (anak.nik) out["nik"] = anak.nik;
    if (anak.nama) out["nama_lengkap"] = anak.nama;
    const jk = genderCode(anak.jenis_kelamin);
    if (jk) out["jenis_kelamin"] = jk;
    // Address from KK header, not from member row
    const alamat = str(fields, "alamat");
    if (alamat) out["alamat"] = alamat;
  }

  // ── Ayah ─────────────────────────────────────────────────────────────────
  const kepalaMale = anggota.find(
    (m) =>
      m.status_hubungan?.toLowerCase().includes("kepala keluarga") &&
      genderCode(m.jenis_kelamin) === "L",
  );
  const suami = findMember("suami");
  const kepalaAny = findMember("kepala keluarga");
  const ayah = kepalaMale ?? suami ?? kepalaAny;
  if (ayah?.nama) out["nama_ayah"] = ayah.nama;

  // ── Ibu ──────────────────────────────────────────────────────────────────
  const ibu = findMember("istri");
  if (ibu?.nama) out["nama_ibu"] = ibu.nama;

  return out;
}
