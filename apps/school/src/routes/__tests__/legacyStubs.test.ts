import { describe, expect, it } from "vitest";
import { Route as KelasIndexStub } from "../sch.$sekolah.kelas.index";
import { Route as KelasSplatStub } from "../sch.$sekolah.kelas.$";
import { Route as JadwalIndexStub } from "../sch.$sekolah.jadwal.index";
import { Route as JadwalSplatStub } from "../sch.$sekolah.jadwal.$";
import { Route as EkskulIndexStub } from "../sch.$sekolah.ekstrakurikuler.index";
import { Route as EkskulSplatStub } from "../sch.$sekolah.ekstrakurikuler.$";

function goOf(route: { options: { beforeLoad?: (ctx: never) => unknown } }, params: Record<string, string>) {
  try {
    route.options.beforeLoad?.({ params, location: { searchStr: "" } } as never);
    return null;
  } catch (err) {
    return (err as { options: { search?: { go?: string } } }).options.search?.go ?? null;
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
