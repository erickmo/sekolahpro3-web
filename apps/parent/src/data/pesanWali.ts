/**
 * Parent-side "Pesan Wali" thread — the 2-way conversation with a child's teacher,
 * backed by the BE Fase 2 wali API (sekolahpro3 #51):
 *   list_pesan(child_id)  → thread (teacher outbound + parent replies)
 *   reply_pesan(child_id, pesan_wali, isi) → parent reply (arah=masuk) + source Dibalas
 *
 * Query key uses CHILD_QUERY_PREFIX + {nis} so the active-child switcher + 403 handling
 * (lib/childAccess) apply uniformly.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { frappeFetch } from "@sekolahpro/api-client";
import { CHILD_QUERY_PREFIX } from "../lib/childAccess";

const M_LIST = "sekolahpro.api.mobile.v1.wali_pesan.list_pesan";
const M_REPLY = "sekolahpro.api.mobile.v1.wali_pesan.reply_pesan";
const QUERY_KEY = `${CHILD_QUERY_PREFIX}pesan_wali`;
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export interface PesanWaliMessage {
  name: string;
  guru?: string;
  kategori?: string;
  isi: string;
  arah: "keluar" | "masuk";
  status?: string;
  thread_key?: string;
  creation?: string;
}

/** The teacher-thread messages for one child (chronological), keyed for child-scope handling. */
export function useWaliThread(nis: string | null) {
  return useQuery<PesanWaliMessage[]>({
    queryKey: [QUERY_KEY, { nis }],
    queryFn: async () => {
      if (USE_MOCKS || !nis) return [];
      const out = await frappeFetch<{ pesan: PesanWaliMessage[] }>(M_LIST, { child_id: nis });
      return out.pesan ?? [];
    },
    enabled: !!nis,
  });
}

/** Parent reply to a teacher message; invalidates the child's thread on success. */
export function useReplyWali(nis: string | null) {
  const qc = useQueryClient();
  return useMutation<{ name: string; status: string }, Error, { pesan_wali: string; isi: string }>({
    mutationFn: (args) =>
      frappeFetch<{ name: string; status: string }>(M_REPLY, {
        child_id: nis!,
        pesan_wali: args.pesan_wali,
        isi: args.isi,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, { nis }] });
    },
  });
}
