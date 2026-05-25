// Reusable workflow helpers for Jadwal sub-domain (status transitions via updateResource).
// Kept here to avoid duplicating mutation wiring across detail routes.

import { useQueryClient } from "@tanstack/react-query";
import { useResourceUpdate } from "@sekolahpro/api-client";

export interface UseStatusTransitionOptions {
  doctype: string;
  name: string | undefined;
}

export function useStatusTransition({ doctype, name }: UseStatusTransitionOptions) {
  const qc = useQueryClient();
  const mut = useResourceUpdate(doctype);
  const setStatus = async (status: string, extra?: Record<string, unknown>) => {
    if (!name) return;
    await mut.mutateAsync({ name, patch: { status, ...(extra ?? {}) } });
    qc.invalidateQueries({ queryKey: ["resource:doc", doctype, name] });
    qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
  };
  return { setStatus, isPending: mut.isPending };
}
