import { describe, expect, it } from "vitest";
import { KOPERASI_NAV, type KoperasiNavSection } from "../koperasi-nav";
import { filterKoperasiNav } from "./filterKoperasiNav";

function titles(sections: KoperasiNavSection[]): string[] {
  return sections.map((s) => s.title);
}
function itemLabels(sections: KoperasiNavSection[], title: string): string[] {
  return sections.find((s) => s.title === title)?.items.map((i) => i.label) ?? [];
}

describe("filterKoperasiNav", () => {
  it("syariah: Baitul Maal (ZIS+Penyaluran+Program+Wakaf), Akad label, no Suku Bunga, SHU in Admin", () => {
    const out = filterKoperasiNav(KOPERASI_NAV, true);
    expect(titles(out)).toContain("Baitul Maal");
    expect(itemLabels(out, "Baitul Maal")).toEqual(["ZIS", "Penyaluran", "Program", "Wakaf"]);
    expect(itemLabels(out, "Pembiayaan")).toContain("Akad");
    expect(itemLabels(out, "Pembiayaan")).not.toContain("Suku Bunga");
    expect(itemLabels(out, "Admin")).toContain("SHU");
  });

  it("konvensional: no Baitul Maal, Pinjaman label, Suku Bunga present, SHU in Admin", () => {
    const out = filterKoperasiNav(KOPERASI_NAV, false);
    expect(titles(out)).not.toContain("Baitul Maal");
    expect(itemLabels(out, "Pembiayaan")).toContain("Pinjaman");
    expect(itemLabels(out, "Pembiayaan")).not.toContain("Akad");
    expect(itemLabels(out, "Pembiayaan")).toContain("Suku Bunga");
    expect(itemLabels(out, "Admin")).toContain("SHU");
  });

  it("drops a section emptied by item filtering", () => {
    const out = filterKoperasiNav(
      [{ title: "X", items: [{ to: "/a", label: "A", mode: "syariah" }] }],
      false,
    );
    expect(titles(out)).not.toContain("X");
  });
});
