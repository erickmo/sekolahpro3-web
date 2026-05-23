import { create } from "zustand";

export interface SessionState {
  user: string | null;
  roles: string[];
  csrfToken: string | null;
  status: "loading" | "authenticated" | "guest";
  setSession: (s: { user: string; roles: string[]; csrfToken: string }) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  roles: [],
  csrfToken: null,
  status: "loading",
  setSession: ({ user, roles, csrfToken }) =>
    set({ user, roles, csrfToken, status: "authenticated" }),
  clear: () => set({ user: null, roles: [], csrfToken: null, status: "guest" }),
}));
