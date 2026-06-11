import { describe, expect, it } from "vitest";
import { Route as KelasIndexStub } from "../sch.$sekolah.kelas.index";
import { Route as KelasSplatStub } from "../sch.$sekolah.kelas.$";
import { Route as JadwalIndexStub } from "../sch.$sekolah.jadwal.index";
import { Route as JadwalSplatStub } from "../sch.$sekolah.jadwal.$";
import { Route as EkskulIndexStub } from "../sch.$sekolah.ekstrakurikuler.index";
import { Route as EkskulSplatStub } from "../sch.$sekolah.ekstrakurikuler.$";
import { Route as PpdbIndexStub } from "../sch.$sekolah.ppdb.index";
import { Route as PpdbSplatStub } from "../sch.$sekolah.ppdb.$";

function goOf(route: { options: { beforeLoad?: (ctx: never) => unknown } }, params: Record<string, string>) {
  try {
    route.options.beforeLoad?.({ params, location: { searchStr: "" } } as never);
    return null;
  } catch (err) {
    return (err as { options: { search?: { go?: string } } }).options.search?.go ?? null;
  }
}

/**
 * Helper for directStubBeforeLoad stubs — reads the href from the thrown redirect.
 * Used for stubs that redirect directly (no $ta resolution) and carry search strings.
 *
 * @param route - The stub Route object.
 * @param params - Route params to inject (sekolah, optional _splat).
 * @param searchStr - Raw query string to inject (e.g. "?tab=berkas" or "").
 * @returns The href string from the thrown redirect, or null if no redirect thrown.
 */
function hrefOf(
  route: { options: { beforeLoad?: (ctx: never) => unknown } },
  params: Record<string, string>,
  searchStr = "",
): string | null {
  try {
    route.options.beforeLoad?.({ params, location: { searchStr } } as never);
    return null;
  } catch (err) {
    return (err as { options: { href?: string } }).options.href ?? null;
  }
}

describe("legacy /kelas stubs", () => {
  it("index stub forwards go=kelas", () => {
    expect(goOf(KelasIndexStub, { sekolah: "demo" })).toBe("kelas");
  });
  it("splat stub carries the deep subpath", () => {
    expect(goOf(KelasSplatStub, { sekolah: "demo", _splat: "rombel" })).toBe("kelas/rombel");
  });
});

describe("legacy /jadwal stubs", () => {
  it("index stub forwards go=jadwal", () => {
    expect(goOf(JadwalIndexStub, { sekolah: "demo" })).toBe("jadwal");
  });
  it("splat stub carries the deep subpath", () => {
    expect(goOf(JadwalSplatStub, { sekolah: "demo", _splat: "papan" })).toBe("jadwal/papan");
  });
});

describe("legacy /ekstrakurikuler stubs", () => {
  it("index stub forwards go=ekskul", () => {
    expect(goOf(EkskulIndexStub, { sekolah: "demo" })).toBe("ekskul");
  });
  it("splat stub carries the deep subpath", () => {
    expect(goOf(EkskulSplatStub, { sekolah: "demo", _splat: "program" })).toBe("ekskul/program");
  });
});

describe("legacy /ppdb stubs", () => {
  it("index stub redirects to /sch/demo/akademik/ppdb", () => {
    expect(hrefOf(PpdbIndexStub, { sekolah: "demo" })).toBe("/sch/demo/akademik/ppdb");
  });
  it("splat stub preserves deep path + query string", () => {
    expect(
      hrefOf(PpdbSplatStub, { sekolah: "demo", _splat: "PPDB-0001" }, "?tab=berkas"),
    ).toBe("/sch/demo/akademik/ppdb/PPDB-0001?tab=berkas");
  });
});
