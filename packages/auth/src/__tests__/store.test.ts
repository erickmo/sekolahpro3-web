import { describe, expect, it, beforeEach } from "vitest";
import { useSessionStore } from "../store";

describe("session store activeSekolah", () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it("setActiveSekolah stores selection", () => {
    useSessionStore.getState().setActiveSekolah({
      name: "Sekolah A",
      nama: "Sekolah Alpha",
      subdomain: "alpha",
    });
    expect(useSessionStore.getState().activeSekolah?.name).toBe("Sekolah A");
  });

  it("clear() resets activeSekolah to null", () => {
    useSessionStore.getState().setActiveSekolah({
      name: "Sekolah A", nama: "A", subdomain: "a",
    });
    useSessionStore.getState().clear();
    expect(useSessionStore.getState().activeSekolah).toBeNull();
  });
});
