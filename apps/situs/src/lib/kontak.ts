import { useMutation } from "@tanstack/react-query";
import { call } from "./api";

export interface KontakPayload {
  sekolah: string;
  nama: string;
  email: string;
  telepon: string;
  pesan: string;
}

interface KontakResult {
  ok: boolean;
  id?: string;
}

/** Submit the contact form to the per-school inbox (scoped server-side). */
export function useSubmitKontak() {
  return useMutation<KontakResult, Error, KontakPayload>({
    mutationFn: (payload) => call<KontakResult>("situs.submit_kontak", { ...payload }),
  });
}
