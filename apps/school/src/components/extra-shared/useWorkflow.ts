import { useQueryClient } from "@tanstack/react-query";
import { useResourceUpdate } from "@sekolahpro/api-client";

// Lightweight workflow action helper. P2 stand-in for real Frappe workflow
// transitions: just PUTs status (or any patch) and invalidates the relevant
// resource list + doc queries so the UI re-fetches.

export function useWorkflowAction(doctype: string) {
  const qc = useQueryClient();
  const mut = useResourceUpdate(doctype);
  return {
    isPending: mut.isPending,
    run: async (name: string, patch: Record<string, unknown>) => {
      await mut.mutateAsync({ name, patch });
      qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
      qc.invalidateQueries({ queryKey: ["resource:doc", doctype, name] });
    },
  };
}
