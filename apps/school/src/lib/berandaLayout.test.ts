import { describe, it, expect } from "vitest";
import {
  BERANDA_LAYOUT,
  getBerandaLayout,
  PANEL_KEYS,
  type PanelKey,
} from "./berandaLayout";
import { ALL_BERANDA_ROLES } from "./berandaRole";

describe("BERANDA_LAYOUT", () => {
  it("defines a layout for every persona", () => {
    for (const role of ALL_BERANDA_ROLES) {
      expect(BERANDA_LAYOUT[role]).toBeDefined();
    }
  });

  it("every layout surfaces the Antrean Saya hero", () => {
    for (const role of ALL_BERANDA_ROLES) {
      expect(BERANDA_LAYOUT[role].panels).toContain("antrean");
    }
  });

  it("only uses valid panel keys and never duplicates a panel", () => {
    for (const role of ALL_BERANDA_ROLES) {
      const panels = BERANDA_LAYOUT[role].panels;
      for (const p of panels) expect(PANEL_KEYS).toContain(p);
      expect(new Set(panels).size).toBe(panels.length);
    }
  });

  it("oversight roles (kepala, bendahara) show an expanded Konteks strip", () => {
    expect(BERANDA_LAYOUT.kepala_sekolah.konteks).toBe("expanded");
    expect(BERANDA_LAYOUT.bendahara.konteks).toBe("expanded");
  });

  it("tu_operator collapses Konteks to a chip", () => {
    expect(BERANDA_LAYOUT.tu_operator.konteks).toBe("collapsed");
  });

  it("teaching roles (guru, wali_kelas) hide the Konteks strip", () => {
    expect(BERANDA_LAYOUT.guru.konteks).toBe("hidden");
    expect(BERANDA_LAYOUT.wali_kelas.konteks).toBe("hidden");
  });

  it("guru is the leanest: only hari-saya + antrean, no sinyal/tren", () => {
    expect(BERANDA_LAYOUT.guru.panels).toEqual(["hari-saya", "antrean"]);
  });

  it("tu_operator gets the AksiCepat grid; teaching roles do not", () => {
    expect(BERANDA_LAYOUT.tu_operator.panels).toContain("aksi-cepat");
    expect(BERANDA_LAYOUT.guru.panels).not.toContain("aksi-cepat");
    expect(BERANDA_LAYOUT.wali_kelas.panels).not.toContain("aksi-cepat");
  });

  it("wali_kelas gets the rombel-scoped Sinyal panel", () => {
    expect(BERANDA_LAYOUT.wali_kelas.panels).toContain("sinyal");
  });
});

describe("getBerandaLayout", () => {
  it("returns the layout for a known role", () => {
    expect(getBerandaLayout("guru")).toBe(BERANDA_LAYOUT.guru);
  });

  it("falls back to tu_operator for an unknown role", () => {
    expect(getBerandaLayout("nope" as PanelKey as never)).toBe(BERANDA_LAYOUT.tu_operator);
  });
});
