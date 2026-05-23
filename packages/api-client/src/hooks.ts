import { useQuery, useMutation, UseQueryOptions } from "@tanstack/react-query";
import { frappeFetch } from "./frappeFetch";

export function useFrappeMethod<T>(
  name: string,
  args: Record<string, unknown> = {},
  options: Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> = {},
) {
  return useQuery<T>({
    queryKey: [name, args],
    queryFn: () => frappeFetch<T>(name, args),
    ...options,
  });
}

export function useFrappeList<T>(
  doctype: string,
  filters: Record<string, unknown> = {},
) {
  return useFrappeMethod<T[]>("frappe.client.get_list", { doctype, ...filters });
}

export function useFrappeMutation<TIn extends Record<string, unknown>, TOut = unknown>(
  method: string,
) {
  return useMutation<TOut, Error, TIn>({
    mutationFn: (args) => frappeFetch<TOut>(method, args),
  });
}
