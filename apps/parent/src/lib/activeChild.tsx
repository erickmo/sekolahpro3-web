import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useChildren } from "../data/children";
import type { ChildSummary } from "../data/types";
import { CHILD_QUERY_PREFIX, FORBIDDEN_NOTICE, isChildQueryKey, isForbidden, nisFromQueryKey } from "./childAccess";

const STORAGE_KEY = "activeChildNis";

interface ActiveChildCtx {
  activeNis: string | null;
  setActiveNis: (nis: string) => void;
  children: ChildSummary[];
  isLoading: boolean;
  notice: string | null;
  dismissNotice: () => void;
}

const Ctx = createContext<ActiveChildCtx | null>(null);

function invalidateChildQueries(qc: QueryClient) {
  qc.invalidateQueries({
    predicate: (q) => isChildQueryKey(q.queryKey),
  });
}

export function ActiveChildProvider({ children: kids }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useChildren();
  const list = useMemo(() => data ?? [], [data]);

  const [activeNis, setActiveNisState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(STORAGE_KEY);
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [deniedNis, setDeniedNis] = useState<string | null>(null);

  useEffect(() => {
    if (activeNis || list.length === 0) return;
    const first = list[0]!.nis;
    setActiveNisState(first);
    window.sessionStorage.setItem(STORAGE_KEY, first);
  }, [activeNis, list]);

  const setActiveNis = useCallback(
    (nis: string) => {
      setActiveNisState(nis);
      window.sessionStorage.setItem(STORAGE_KEY, nis);
      invalidateChildQueries(qc);
    },
    [qc],
  );

  // Flag the denied child when a per-child fetch returns 403.
  useEffect(() => {
    const cache = qc.getQueryCache();
    return cache.subscribe((event) => {
      const query = event.query;
      if (!isChildQueryKey(query.queryKey) || !isForbidden(query.state.error)) return;
      setNotice(FORBIDDEN_NOTICE);
      setDeniedNis(nisFromQueryKey(query.queryKey));
    });
  }, [qc]);

  // Reset to the first authorized child once the denied child is known.
  useEffect(() => {
    if (!deniedNis || list.length === 0 || activeNis !== deniedNis) return;
    const fallback = list.find((c) => c.nis !== deniedNis);
    if (fallback) setActiveNis(fallback.nis);
  }, [deniedNis, list, activeNis, setActiveNis]);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const value = useMemo<ActiveChildCtx>(
    () => ({ activeNis, setActiveNis, children: list, isLoading, notice, dismissNotice }),
    [activeNis, setActiveNis, list, isLoading, notice, dismissNotice],
  );

  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useActiveChild(): ActiveChildCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useActiveChild must be used within ActiveChildProvider");
  return v;
}

export { CHILD_QUERY_PREFIX };
