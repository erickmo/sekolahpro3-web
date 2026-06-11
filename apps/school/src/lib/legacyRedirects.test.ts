/**
 * Unit tests for the legacy-URL stub redirect factories (Fase 1 single-door spec §1.6).
 *
 * workspaceStubBeforeLoad — routes through the hub (?go=) when the target lives
 *   under /akademik/$ta (TA unknown at redirect time).
 * directStubBeforeLoad — rewrites path from URL parts for ta-less routes (PPDB).
 */
import { describe, expect, it } from "vitest";
import { directStubBeforeLoad, workspaceStubBeforeLoad } from "./legacyRedirects";

/** The factories throw the TanStack redirect Response; catch and inspect `.options`. */
function catchRedirect(fn: () => void) {
  try {
    fn();
  } catch (err) {
    return (err as { options: { to?: string; href?: string; search?: { go?: string }; replace?: boolean } }).options;
  }
  throw new Error("expected redirect");
}

describe("workspaceStubBeforeLoad", () => {
  it("sends the module root through the hub go param", () => {
    const o = catchRedirect(() =>
      workspaceStubBeforeLoad("kelas")({ params: { sekolah: "demo" } } as never),
    );
    expect(o.to).toBe("/sch/$sekolah/akademik");
    expect(o.search?.go).toBe("kelas");
    expect(o.replace).toBe(true);
  });
  it("appends the splat subpath when present", () => {
    const o = catchRedirect(() =>
      workspaceStubBeforeLoad("ekskul")({ params: { sekolah: "demo", _splat: "program" } } as never),
    );
    expect(o.search?.go).toBe("ekskul/program");
  });
});

describe("directStubBeforeLoad", () => {
  it("rewrites the path from parts, preserving query string", () => {
    const o = catchRedirect(() =>
      directStubBeforeLoad("akademik/ppdb")({
        params: { sekolah: "demo", _splat: "PPDB-0001" },
        location: { searchStr: "?tab=berkas" },
      } as never),
    );
    expect(o.href).toBe("/sch/demo/akademik/ppdb/PPDB-0001?tab=berkas");
  });
  it("targets the module root when no splat", () => {
    const o = catchRedirect(() =>
      directStubBeforeLoad("akademik/ppdb")({ params: { sekolah: "demo" }, location: { searchStr: "" } } as never),
    );
    expect(o.href).toBe("/sch/demo/akademik/ppdb");
  });
});
