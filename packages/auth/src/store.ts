import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ActiveSekolah {
  name: string;
  nama: string;
  subdomain: string | null;
  slug: string;
}

export interface SessionState {
  user: string | null;
  roles: string[];
  csrfToken: string | null;
  status: "loading" | "authenticated" | "guest";
  activeSekolah: ActiveSekolah | null;
  setSession: (s: { user: string; roles: string[]; csrfToken: string }) => void;
  setActiveSekolah: (s: ActiveSekolah) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      roles: [],
      csrfToken: null,
      status: "loading",
      activeSekolah: null,
      setSession: ({ user, roles, csrfToken }) =>
        set({ user, roles, csrfToken, status: "authenticated" }),
      setActiveSekolah: (s) => set({ activeSekolah: s }),
      clear: () =>
        set({
          user: null,
          roles: [],
          csrfToken: null,
          status: "guest",
          activeSekolah: null,
        }),
    }),
    {
      name: "sekolahpro.session",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        roles: s.roles,
        csrfToken: s.csrfToken,
        status: s.status,
        activeSekolah: s.activeSekolah,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.status = state.user ? "authenticated" : "loading";
      },
    },
  ),
);
