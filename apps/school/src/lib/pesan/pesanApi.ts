/**
 * Pesan backend API seam (TanStack Query over the whitelisted methods shipped in BE
 * Fase 2 — sekolahpro3 PRs #47/#49/#50/#51). One place wiring the FE to the server so
 * components never hand-roll frappeFetch paths.
 *
 * Mirrors lib/ppdbApi.ts. `sekolah` is the route slug; the BE resolves slug→name and
 * enforces membership, and frappeFetch also sends the X-Active-Sekolah header.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { frappeFetch } from "@sekolahpro/api-client";
import type { CommHealth } from "../pesanSla";

const M_PESAN = "sekolahpro.api.pesan";
const M_COMM_HEALTH = `${M_PESAN}.pesan_comm_health`;
const M_RESOLVE_AUDIENCE = `${M_PESAN}.resolve_pesan_audience`;

const M_WALI = "sekolahpro.api.mobile.v1.wali_pesan";
const M_LIST_PESAN = `${M_WALI}.list_pesan`;
const M_REPLY_PESAN = `${M_WALI}.reply_pesan`;

/** One resolved recipient of an audience descriptor. */
export interface PesanRecipient {
  to: string;
  nama: string;
  siswa: string;
}

export interface AudienceResult {
  recipients: PesanRecipient[];
  count: number;
}

/** A single message in a Pesan Wali thread (parent-facing list). */
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

/**
 * Server-authoritative communication-health signals for the Kepsek oversight panel
 * (full inbox, not just the loaded rows). Falls through to the FE client estimate at the
 * call site while loading / on error.
 */
export function useCommHealth(sekolah: string) {
  return useQuery<CommHealth>({
    queryKey: ["pesan:comm-health", sekolah],
    queryFn: () => frappeFetch<CommHealth>(M_COMM_HEALTH, { sekolah }),
    enabled: !!sekolah,
  });
}

/** Resolve an audience descriptor to recipients + count (advisory preview for the composer). */
export function useResolveAudience(
  sekolah: string,
  audiensType: string,
  audiensFilter: Record<string, unknown> | undefined,
  enabled: boolean,
) {
  return useQuery<AudienceResult>({
    queryKey: ["pesan:audience", sekolah, audiensType, audiensFilter ?? {}],
    queryFn: () =>
      frappeFetch<AudienceResult>(M_RESOLVE_AUDIENCE, {
        sekolah,
        audiens_type: audiensType,
        audiens_filter: JSON.stringify(audiensFilter ?? {}),
      }),
    enabled: enabled && !!sekolah && !!audiensType,
  });
}

/** Parent-facing thread for one child (teacher messages + parent replies, chronological). */
export function useListPesan(childId: string | undefined) {
  return useQuery<{ pesan: PesanWaliMessage[] }>({
    queryKey: ["pesan:wali-thread", childId],
    queryFn: () => frappeFetch<{ pesan: PesanWaliMessage[] }>(M_LIST_PESAN, { child_id: childId! }),
    enabled: !!childId,
  });
}

/** Parent reply to a teacher message; invalidates the thread on success. */
export function useReplyPesan() {
  const qc = useQueryClient();
  return useMutation<
    { name: string; status: string },
    Error,
    { child_id: string; pesan_wali: string; isi: string }
  >({
    mutationFn: (args) => frappeFetch<{ name: string; status: string }>(M_REPLY_PESAN, args),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["pesan:wali-thread", vars.child_id] });
    },
  });
}
