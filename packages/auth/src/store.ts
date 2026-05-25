import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface SessionState {
  user: string | null;
  roles: string[];
  csrfToken: string | null;
  status: "loading" | "authenticated" | "guest";
  setSession: (s: { user: string; roles: string[]; csrfToken: string }) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      roles: [],
      csrfToken: null,
      status: "loading",
      setSession: ({ user, roles, csrfToken }) =>
        set({ user, roles, csrfToken, status: "authenticated" }),
      clear: () => set({ user: null, roles: [], csrfToken: null, status: "guest" }),
    }),
    {
      name: "sekolahpro.session",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, roles: s.roles, status: s.status }),
      onRehydrateStorage: () => (state) => {
        if (state && state.user && state.status === "authenticated") {
          state.status = "authenticated";
        } else if (state) {
          state.status = "loading";
        }
      },
    },
  ),
);
