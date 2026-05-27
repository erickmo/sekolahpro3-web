import { useMutation, useQuery } from "@tanstack/react-query";
import { apiCall } from "../../lib/api-client";
import type { FullPpdbInput, JenisDokumen } from "./schema";

export interface Gelombang {
  name: string;
  nama: string;
  tingkat: string;
  tanggal_buka: string;
  tanggal_tutup: string;
  biaya_pendaftaran: number;
  kuota: number;
  kuota_terpakai?: number;
  sisa_kuota?: number;
}

export interface DaftarResponse {
  nomor_pendaftaran: string;
  calon_siswa: string;
}

export interface UploadResponse {
  file_url: string;
  file_name: string;
}

export function useGelombangAktif() {
  return useQuery({
    queryKey: ["ppdb", "gelombang-aktif"],
    queryFn: () =>
      apiCall<Gelombang[]>(
        "GET",
        "sekolahpro.ppdb.api.ppdb.get_gelombang_aktif",
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDaftarCalonSiswa() {
  return useMutation({
    mutationFn: (payload: FullPpdbInput) =>
      apiCall<DaftarResponse>(
        "POST",
        "sekolahpro.ppdb.api.ppdb.daftar_calon_siswa",
        { payload },
      ),
  });
}

export interface UploadInput {
  turnstile_token: string;
  jenis: JenisDokumen;
  file: File;
}

export function useUploadDokumen() {
  return useMutation({
    mutationFn: async ({ turnstile_token, jenis, file }: UploadInput) => {
      const filedata = await fileToBase64(file);
      return apiCall<UploadResponse>(
        "POST",
        "sekolahpro.ppdb.api.ppdb.upload_dokumen_ppdb",
        {
          turnstile_token,
          jenis,
          filename: file.name,
          filedata,
          mime_type: file.type,
        },
      );
    },
  });
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
