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
      slug: "sekolah-a",
    });
    expect(useSessionStore.getState().activeSekolah?.name).toBe("Sekolah A");
  });

  it("clear() resets activeSekolah to null", () => {
    useSessionStore.getState().setActiveSekolah({
      name: "Sekolah A", nama: "A", subdomain: "a", slug: "sekolah-a",
    });
    useSessionStore.getState().clear();
    expect(useSessionStore.getState().activeSekolah).toBeNull();
  });

  it("activeSekolah preserves slug field", () => {
    useSessionStore.getState().setActiveSekolah({
      name: "SD Aletheia Malang",
      nama: "SD Aletheia Malang",
      subdomain: null,
      slug: "sd-aletheia-malang",
    });
    expect(useSessionStore.getState().activeSekolah?.slug).toBe("sd-aletheia-malang");
  });
});
