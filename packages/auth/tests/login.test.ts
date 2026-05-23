import { describe, it, expect, beforeEach, vi } from "vitest";
import { configure } from "@sekolahpro/api-client";
import { login, logout } from "../src/api";
import { useSessionStore } from "../src/store";

beforeEach(() => {
  configure({ baseUrl: "https://api.test" });
  useSessionStore.getState().clear();
});

describe("login", () => {
  it("sets session on success", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls++;
      if (String(url).includes("/api/method/login")) {
        return new Response(JSON.stringify({ message: "Logged In" }), { status: 200 });
      }
      if (String(url).includes("get_logged_user")) {
        return new Response(JSON.stringify({ message: "user@school.id" }), { status: 200 });
      }
      if (String(url).includes("get_roles")) {
        return new Response(JSON.stringify({ message: ["Guru"] }), { status: 200 });
      }
      if (String(url).includes("get_csrf")) {
        return new Response(JSON.stringify({ message: "csrf-xyz" }), { status: 200 });
      }
      return new Response("{}", { status: 200 });
    }));

    await login("user@school.id", "pwd");

    const state = useSessionStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.user).toBe("user@school.id");
    expect(state.roles).toEqual(["Guru"]);
    expect(state.csrfToken).toBe("csrf-xyz");
    expect(calls).toBeGreaterThanOrEqual(4);
  });

  it("logout clears session", async () => {
    useSessionStore.getState().setSession({ user: "u", roles: ["Guru"], csrfToken: "t" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    await logout();
    expect(useSessionStore.getState().status).toBe("guest");
  });
});
