/**
 * Fase 2 single-door additions: parseGoParam accepts the absensi/pendaftaran
 * roots, isSubmodulePath treats absensi as a chrome-bypass submodule but NOT
 * pendaftaran, the workspace pill bar exposes both new entries, and the new
 * redirect stubs throw the right hub redirect.
 */
import { describe, it, expect } from "vitest";
import { parseGoParam, isSubmodulePath, buildWorkspaceNavGroups } from "../../lib/akademikNav";
import { hubGoStubBeforeLoad, workspaceStubBeforeLoad } from "../../lib/legacyRedirects";

describe("parseGoParam — Fase 2 roots", () => {
  it("accepts absensi, pendaftaran and nested sub-paths", () => {
    expect(parseGoParam("absensi")).toBe("absensi");
    expect(parseGoParam("absensi/guru")).toBe("absensi/guru");
    expect(parseGoParam("pendaftaran")).toBe("pendaftaran");
    expect(parseGoParam("pendaftaran/new")).toBe("pendaftaran/new");
    expect(parseGoParam("kelas/anggota")).toBe("kelas/anggota");
  });
  it("still rejects unknown roots and traversal", () => {
    expect(parseGoParam("siswa")).toBeNull();
    expect(parseGoParam("absensi/../siswa")).toBeNull();
  });
});

describe("isSubmodulePath — Fase 2", () => {
  it("treats absensi as a submodule (own shell)", () => {
    expect(isSubmodulePath("/sch/A/akademik/2024/absensi")).toBe(true);
    expect(isSubmodulePath("/sch/A/akademik/2024/absensi/guru")).toBe(true);
  });
  it("does NOT treat pendaftaran as a submodule (keeps akademik chrome)", () => {
    expect(isSubmodulePath("/sch/A/akademik/2024/pendaftaran")).toBe(false);
    expect(isSubmodulePath("/sch/A/akademik/2024/pendaftaran/new")).toBe(false);
  });
});

describe("buildWorkspaceNavGroups — Fase 2 entries", () => {
  it("exposes Absensi and Pendaftaran Siswa pill entries", () => {
    const all = buildWorkspaceNavGroups().flatMap((g) => g.items);
    expect(all.some((i) => i.to === "/sch/$sekolah/akademik/$ta/absensi")).toBe(true);
    expect(all.some((i) => i.to === "/sch/$sekolah/akademik/$ta/pendaftaran")).toBe(true);
  });
});

describe("redirect stubs — Fase 2", () => {
  type RedirectShape = { to?: string; search?: { go?: string }; params?: { sekolah?: string } };
  function caughtRedirect(fn: () => never, sekolah = "A", _splat?: string): RedirectShape {
    try {
      fn({ params: { sekolah, ...(_splat ? { _splat } : {}) }, location: { searchStr: "" } } as never);
    } catch (e) {
      // TanStack's thrown redirect carries its target under `.options`; fall back
      // to the object itself for forward-compat with flatter shapes.
      const err = e as { options?: RedirectShape };
      return err.options ?? (e as RedirectShape);
    }
    throw new Error("expected redirect to throw");
  }
  it("hubGoStubBeforeLoad routes a fixed go target through the hub", () => {
    const r = caughtRedirect(hubGoStubBeforeLoad("kelas/anggota"));
    expect(r.to).toBe("/sch/$sekolah/akademik");
    expect(r.search?.go).toBe("kelas/anggota");
    expect(r.params?.sekolah).toBe("A");
  });
  it("workspaceStubBeforeLoad('pendaftaran') forwards the splat", () => {
    const r = caughtRedirect(workspaceStubBeforeLoad("pendaftaran"), "A", "new");
    expect(r.search?.go).toBe("pendaftaran/new");
  });
  it("workspaceStubBeforeLoad('absensi') forwards bare root", () => {
    const r = caughtRedirect(workspaceStubBeforeLoad("absensi"), "A");
    expect(r.search?.go).toBe("absensi");
  });
});
