const GLOSSARY_RAW = {
  KKM: "Kriteria Ketuntasan Minimal — nilai minimum yang harus dicapai siswa untuk dianggap tuntas pada suatu mapel.",
  SHU: "Sisa Hasil Usaha — keuntungan koperasi yang dibagikan ke anggota di akhir periode.",
  ZIS: "Zakat, Infaq, Sedekah — dana sosial yang dikelola koperasi/sekolah.",
  Rombel: "Rombongan Belajar — kelompok siswa dalam satu kelas paralel.",
  PPDB: "Penerimaan Peserta Didik Baru — proses pendaftaran siswa baru.",
  SK: "Surat Keputusan — dokumen formal pengangkatan/penugasan.",
  NIS: "Nomor Induk Siswa.",
  NIP: "Nomor Induk Pegawai.",
  TA: "Tahun Ajaran.",
} as const;

export type GlossaryTerm = keyof typeof GLOSSARY_RAW;

export const GLOSSARY: Record<GlossaryTerm, string> = GLOSSARY_RAW;

export function defOf(term: string): string | undefined {
  return (GLOSSARY as Record<string, string | undefined>)[term];
}
