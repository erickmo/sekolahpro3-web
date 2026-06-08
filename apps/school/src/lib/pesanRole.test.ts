import { describe, it, expect } from "vitest";
import {
  pesanRoles,
  isKepsekPesan,
  isGuruPesan,
  PESAN_ROLE_LABEL,
  PESAN_ROLE_PRIORITY,
  type PesanRole,
} from "./pesanRole";

const ALL: PesanRole[] = ["tu", "guru", "kepsek"];

describe("pesanRoles — mapping", () => {
  it("maps Tata Usaha and operator to tu", () => {
    expect(pesanRoles(["Tata Usaha"]).primary).toBe("tu");
    expect(pesanRoles(["operator"]).primary).toBe("tu");
  });

  it("maps guru / teacher / pengajar to guru", () => {
    expect(pesanRoles(["guru"]).primary).toBe("guru");
    expect(pesanRoles(["Teacher"]).primary).toBe("guru");
    expect(pesanRoles(["Pengajar"]).primary).toBe("guru");
  });

  it("maps Wali Kelas (spaced/dashed) to guru — the Pesan-specific divergence from kelasRole", () => {
    // For Pesan a homeroom teacher IS a guru (messages the wali of their kids).
    expect(pesanRoles(["Wali Kelas"]).primary).toBe("guru");
    expect(pesanRoles(["wali-kelas"]).primary).toBe("guru");
  });

  it("maps Kepala Sekolah to kepsek", () => {
    expect(pesanRoles(["Kepala Sekolah"]).primary).toBe("kepsek");
  });

  it("keeps 'Kepala Tata Usaha' as tu, NOT kepsek (Ka-TU guard)", () => {
    // "Kepala Tata Usaha" contains "kepala" — tata_usaha matcher MUST win first.
    expect(pesanRoles(["Kepala Tata Usaha"]).primary).toBe("tu");
  });
});

describe("pesanRoles — primary precedence", () => {
  it("teaching wins over tu: a guru who is also TU sees the messaging surface", () => {
    expect(pesanRoles(["Tata Usaha", "guru"]).primary).toBe("guru");
  });

  it("oversight wins over teaching: kepsek beats guru", () => {
    expect(pesanRoles(["guru", "Kepala Sekolah"]).primary).toBe("kepsek");
  });

  it("oversight wins over tu", () => {
    expect(pesanRoles(["Tata Usaha", "Kepala Sekolah"]).primary).toBe("kepsek");
  });

  it("priority order is kepsek > guru > tu", () => {
    expect(PESAN_ROLE_PRIORITY).toEqual(["kepsek", "guru", "tu"]);
  });
});

describe("pesanRoles — permissive fallback", () => {
  it("empty input → all buckets, primary tu (keeps the existing split-pane inbox)", () => {
    const d = pesanRoles([]);
    expect(new Set(d.roles)).toEqual(new Set(ALL));
    expect(d.primary).toBe("tu");
  });

  it("no matcher hit → fallback (all buckets, primary tu)", () => {
    const d = pesanRoles(["pustakawan"]);
    expect(new Set(d.roles)).toEqual(new Set(ALL));
    expect(d.primary).toBe("tu");
  });

  it("single guru stays guru", () => {
    const d = pesanRoles(["guru"]);
    expect(d.roles).toEqual(["guru"]);
    expect(d.primary).toBe("guru");
  });
});

describe("pesanRoles — convenience predicates", () => {
  it("isKepsekPesan true only when primary is kepsek", () => {
    expect(isKepsekPesan(["Kepala Sekolah"])).toBe(true);
    expect(isKepsekPesan(["guru"])).toBe(false);
    expect(isKepsekPesan(["Tata Usaha"])).toBe(false);
  });

  it("isGuruPesan true only when primary is guru", () => {
    expect(isGuruPesan(["guru"])).toBe(true);
    expect(isGuruPesan(["Wali Kelas"])).toBe(true);
    expect(isGuruPesan(["Kepala Sekolah"])).toBe(false);
  });
});

describe("PESAN_ROLE_LABEL", () => {
  it("has a Bahasa Indonesia label for every bucket", () => {
    for (const role of ALL) {
      expect(PESAN_ROLE_LABEL[role]).toBeTruthy();
    }
  });
});
