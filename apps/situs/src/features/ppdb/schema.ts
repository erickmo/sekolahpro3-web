import { z } from "zod";

// Mirrors the server-side validation in sekolahpro.api.situs.submit_pendaftaran.
// Kept deliberately lighter than the full landing PPDB wizard: a per-school
// marketing site captures intent + core data; document upload + payment happen
// in the panitia follow-up flow.

export const ppdbSchema = z.object({
  jalur: z.string().min(1, "Pilih jalur pendaftaran"),
  gelombang: z.string().min(1, "Pilih gelombang"),
  nama_lengkap: z.string().min(2, "Nama wajib diisi"),
  nisn: z.string().regex(/^\d{10}$/, "NISN harus 10 digit").or(z.literal("")),
  nik: z.string().regex(/^\d{16}$/, "NIK harus 16 digit"),
  jenis_kelamin: z.enum(["L", "P"], { message: "Pilih jenis kelamin" }),
  tempat_lahir: z.string().min(2, "Wajib diisi"),
  tanggal_lahir: z.string().min(1, "Wajib diisi"),
  asal_sekolah: z.string().min(2, "Wajib diisi"),
  no_hp: z.string().regex(/^08\d{7,12}$/, "Nomor HP tidak valid (mulai 08)"),
  email: z.string().email("Email tidak valid").or(z.literal("")),
  alamat: z.string().min(4, "Wajib diisi"),
  nama_ayah: z.string().min(2, "Wajib diisi"),
  no_hp_ayah: z.string().optional(),
  nama_ibu: z.string().min(2, "Wajib diisi"),
  no_hp_ibu: z.string().optional(),
  consent: z.literal(true, { message: "Persetujuan wajib dicentang" }),
});

export type PpdbFormValues = z.infer<typeof ppdbSchema>;
