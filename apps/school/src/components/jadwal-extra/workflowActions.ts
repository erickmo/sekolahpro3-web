// Workflow transition wiring for Jadwal Pelajaran (SPINE-1).
//
// Replaces the previous fake `useStatusTransition`, which patched a non-existent
// `status` field via updateResource and bypassed the workflow entirely. This calls
// the real Frappe workflow through `sekolahpro.akademik.api.jadwal.transisi_jadwal`:
// the backend enforces both the role (Tata Usaha menyusun/menerbitkan, Kepala
// Sekolah menyetujui/menolak) and the allowed state machine; the UI only names
// the action and renders the resulting workflow_state.

import { useQueryClient } from "@tanstack/react-query";
import { useFrappeMutation } from "@sekolahpro/api-client";

const DOCTYPE_JADWAL = "Jadwal Pelajaran";
const METHOD_TRANSISI = "sekolahpro.akademik.api.jadwal.transisi_jadwal";

// Workflow action names — must match the "Jadwal Pelajaran Workflow" fixture.
export const JADWAL_ACTIONS = {
  ajukan: "Ajukan",
  setujui: "Setujui",
  tolak: "Tolak",
  terbitkan: "Terbitkan",
  cabut: "Cabut",
} as const;

export type JadwalAction = (typeof JADWAL_ACTIONS)[keyof typeof JADWAL_ACTIONS];

interface TransisiArgs extends Record<string, unknown> {
  name: string;
  action: JadwalAction;
}

/**
 * Run a Jadwal Pelajaran workflow transition.
 *
 * Returns the new `workflow_state` from the server and invalidates the doc/list
 * caches (by doctype prefix, so any tenant/name variant is refreshed) to reflect
 * the transition in the UI.
 */
export function useJadwalTransition() {
  const qc = useQueryClient();
  const mut = useFrappeMutation<TransisiArgs, string>(METHOD_TRANSISI);

  const transisi = async (name: string, action: JadwalAction): Promise<string> => {
    const state = await mut.mutateAsync({ name, action });
    qc.invalidateQueries({ queryKey: ["resource:doc", DOCTYPE_JADWAL] });
    qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE_JADWAL] });
    return state;
  };

  return { transisi, isPending: mut.isPending };
}
