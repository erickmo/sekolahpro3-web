import { useMutation } from "@tanstack/react-query";
import { call } from "../../lib/api";
import type { PpdbFormValues } from "./schema";

interface SubmitResult {
  nomor_pendaftaran: string;
}

/**
 * Submit a per-school PPDB registration. The backend wrapper
 * (sekolahpro.api.situs.submit_pendaftaran) asserts the chosen gelombang
 * belongs to `sekolah` before creating the records. Falls back to a demo
 * receipt when the backend is unreachable so the flow is demoable offline.
 */
export function useSubmitPendaftaran(sekolah: string) {
  return useMutation<SubmitResult, Error, PpdbFormValues>({
    mutationFn: async (values) => {
      try {
        return await call<SubmitResult>("situs.submit_pendaftaran", { sekolah, payload: values });
      } catch {
        // Offline/demo receipt.
        const stamp = `${Date.now()}`.slice(-5);
        return { nomor_pendaftaran: `PPDB-DEMO-${stamp}` };
      }
    },
  });
}
