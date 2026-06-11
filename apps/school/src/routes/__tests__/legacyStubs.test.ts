import { describe, expect, it } from "vitest";
import { Route as KelasIndexStub } from "../sch.$sekolah.kelas.index";
import { Route as KelasSplatStub } from "../sch.$sekolah.kelas.$";

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
