import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChildren } from "../data/children";
import type { ChildSummary } from "../data/types";

const STORAGE_KEY = "activeChildNis";

interface ActiveChildCtx {
  activeNis: string | null;
  setActiveNis: (nis: string) => void;
  children: ChildSummary[];
  isLoading: boolean;
}

const Ctx = createContext<ActiveChildCtx | null>(null);

export function ActiveChildProvider({ children: kids }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useChildren();
  const list = useMemo(() => data ?? [], [data]);

  const [activeNis, setActiveNisState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(STORAGE_KEY);
  });

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
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          typeof q.queryKey[0] === "string" &&
          q.queryKey[0].startsWith("sekolahpro.api.parent.child_"),
      });
    },
    [qc],
  );

  const value = useMemo<ActiveChildCtx>(
    () => ({ activeNis, setActiveNis, children: list, isLoading }),
    [activeNis, setActiveNis, list, isLoading],
  );

  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useActiveChild(): ActiveChildCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useActiveChild must be used within ActiveChildProvider");
  return v;
}
