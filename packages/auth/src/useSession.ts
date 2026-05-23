import { useEffect } from "react";
import { useSessionStore } from "./store";
import { hydrateSession } from "./api";

export function useSession() {
  const state = useSessionStore();
  useEffect(() => {
    if (state.status === "loading") {
      void hydrateSession();
    }
  }, [state.status]);
  return state;
}
