import { useMutation, useQueryClient } from "@tanstack/react-query";
import { frappeFetch } from "@sekolahpro/api-client";

// Whitelisted DocType instance methods exposed via Frappe `run_doc_method`.
// Frappe expects { dt, dn, method, args } and returns the method result in `message`.
const RUN_DOC_METHOD = "run_doc_method";

type RunDocMethodArgs = {
  dt: string;
  dn: string;
  method: string;
  args?: Record<string, unknown>;
};

function runDocMethod<T>({ dt, dn, method, args }: RunDocMethodArgs): Promise<T> {
  return frappeFetch<T>(RUN_DOC_METHOD, {
    dt,
    dn,
    method,
    args: JSON.stringify(args ?? {}),
  });
}

/**
 * Mutation hook for a single DocType instance method.
 * Invalidates the doctype's list cache on success so tables refresh.
 */
export function useDocMethod<T = unknown>(doctype: string, method: string) {
  const qc = useQueryClient();
  return useMutation<T, Error, { name: string; args?: Record<string, unknown> }>({
    mutationFn: ({ name, args }) => runDocMethod<T>({ dt: doctype, dn: name, method, args }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
    },
  });
}
