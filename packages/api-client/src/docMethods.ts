// Whitelisted DocType INSTANCE methods exposed via Frappe `run_doc_method`.
// Frappe expects { dt, dn, method, args } and returns the result in `message`.
// This is the canonical client for controller actions (approve/reject/blokir/
// tutup_kas/…) — never emulate them by PATCHing read-only status fields.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { frappeFetch } from "./frappeFetch";

const RUN_DOC_METHOD = "run_doc_method";

export interface RunDocMethodArgs {
  dt: string;
  dn: string;
  method: string;
  args?: Record<string, unknown> | undefined;
}

/** Call a whitelisted instance method on one document. */
export function runDocMethod<T = unknown>({ dt, dn, method, args }: RunDocMethodArgs): Promise<T> {
  return frappeFetch<T>(RUN_DOC_METHOD, {
    dt,
    dn,
    method,
    args: JSON.stringify(args ?? {}),
  });
}

/**
 * Mutation hook for a single DocType instance method. Invalidates the
 * doctype's list AND doc caches on success so tables + detail pages refresh.
 */
export function useDocMethod<T = unknown>(doctype: string, method: string) {
  const qc = useQueryClient();
  return useMutation<T, Error, { name: string; args?: Record<string, unknown> }>({
    mutationFn: ({ name, args }) => runDocMethod<T>({ dt: doctype, dn: name, method, args }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
      void qc.invalidateQueries({ queryKey: ["resource:doc", doctype] });
    },
  });
}
