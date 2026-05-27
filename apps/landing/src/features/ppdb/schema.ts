import { z } from "zod";

export const JENIS_DOKUMEN = [
  "Kartu Keluarga",
  "Akta Lahir",
  "Rapor",
  "Foto",
] as const;
export type JenisDokumen = (typeof JENIS_DOKUMEN)[number];

const phone = z.string().regex(/^08\d{8,11}$/, "No HP harus diawali 08 (10-13 digit)");
const phoneOptional = z.union([phone, z.literal("")]).optional();

export const calonSchema = z.object({
  nisn: z.string().regex(/^\d{10}$/, "NISN 10 digit"),
  nik: z.string().regex(/^\d{16}$/, "NIK 16 digit"),
  nama_lengkap: z.string().min(3).max(100),
  tempat_lahir: z.string().min(2),
  tanggal_lahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
  jenis_kelamin: z.enum(["L", "P"]),
  alamat: z.string().min(5),
  asal_sekolah: z.string().min(2),
  no_hp: phone,
  email: z.string().email(),
});
export type CalonInput = z.infer<typeof calonSchema>;

export const ortuSchema = z.object({
  nama_ayah: z.string().min(2),
  pekerjaan_ayah: z.string().optional(),
  no_hp_ayah: phoneOptional,
  nama_ibu: z.string().min(2),
  pekerjaan_ibu: z.string().optional(),
  no_hp_ibu: phoneOptional,
  nama_wali: z.string().optional(),
  no_hp_wali: phoneOptional,
});
export type OrtuInput = z.infer<typeof ortuSchema>;

export const dokumenItemSchema = z.object({
  jenis: z.enum(JENIS_DOKUMEN),
  file_url: z.string().min(1, "Dokumen wajib diupload"),
});

export const jalurSchema = z.object({
  jalur: z.enum(["Reguler", "Prestasi", "Afirmasi", "Mutasi"]),
  gelombang_ppdb: z.string().min(1, "Pilih gelombang"),
});

export const fullPpdbSchema = z.object({
  ...jalurSchema.shape,
  calon: calonSchema,
  ortu: ortuSchema,
  dokumen: z.array(dokumenItemSchema).length(4, "Lengkapi 4 dokumen"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Anda harus menyetujui kebijakan privasi" }),
  }),
  turnstile_token: z.string().min(1, "Verifikasi captcha wajib"),
});
export type FullPpdbInput = z.infer<typeof fullPpdbSchema>;
