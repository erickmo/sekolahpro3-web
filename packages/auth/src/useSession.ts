import { useEffect, useRef } from "react";
import { setCsrfToken } from "@sekolahpro/api-client";
import { useSessionStore } from "./store";
import { hydrateSession } from "./api";

export function useSession() {
  const state = useSessionStore();
  const revalidated = useRef(false);
  useEffect(() => {
    if (state.status === "loading") {
      void hydrateSession();
      return;
    }
    if (state.status === "authenticated" && !revalidated.current) {
      revalidated.current = true;
      if (state.csrfToken) setCsrfToken(state.csrfToken);
      void hydrateSession();
    }
  }, [state.status, state.csrfToken]);
  return state;
}
