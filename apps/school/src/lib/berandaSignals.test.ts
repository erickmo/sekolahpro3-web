import { describe, it, expect } from "vitest";
import { buildSignals, type BerandaSignalsInput } from "./berandaSignals";
import type { PegawaiApi } from "../features/pegawai/roles";
import type { SiswaRow } from "./orang/siswaStats";

function input(p: Partial<BerandaSignalsInput>): BerandaSignalsInput {
  return { role: "kepala_sekolah", ...p };
}

describe("buildSignals — kepala_sekolah (school-wide, reuses staff/siswa builders)", () => {
  it("reuses deriveStaffActionQueue + deriveActionQueue", () => {
    const pegawai = [{ is_aktif: 0 } as PegawaiApi];
    const siswa: SiswaRow[] = [{ name: "S1", status: "Calon" }];
    const items = buildSignals(input({ role: "kepala_sekolah", pegawai, siswa }));
    const ids = items.map((i) => i.id);
    expect(ids).toContain("staff-nonaktif");
    expect(ids).toContain("siswa-calon");
  });

  it("dedups signals already surfaced as inbox rows (Keputusan #2)", () => {
    const pegawai = [{ is_aktif: 0 } as PegawaiApi];
    const items = buildSignals(input({ role: "kepala_sekolah", pegawai, inboxIds: ["staff-nonaktif"] }));
    expect(items.some((i) => i.id === "staff-nonaktif")).toBe(false);
  });
});

describe("buildSignals — wali_kelas (rombel-scoped counts)", () => {
  it("emits alpa (danger), nunggak (warning), data-incomplete (info); skips zero", () => {
    const items = buildSignals(input({
      role: "wali_kelas",
      wali: { alpaHariIni: 2, nunggakSpp: 3, dataIncomplete: 0 },
    }));
    const alpa = items.find((i) => i.id === "alpa-hari-ini")!;
    expect(alpa.tone).toBe("danger");
    expect(alpa.badge).toBe("2");
    expect(items.find((i) => i.id === "nunggak-spp")!.tone).toBe("warning");
    expect(items.some((i) => i.id === "data-tidak-lengkap")).toBe(false);
  });
});

describe("buildSignals — other roles", () => {
  it("returns no signals for guru / tu_operator / bendahara", () => {
    expect(buildSignals(input({ role: "guru" }))).toEqual([]);
    expect(buildSignals(input({ role: "tu_operator" }))).toEqual([]);
    expect(buildSignals(input({ role: "bendahara" }))).toEqual([]);
  });

  it("returns empty for kepala with no data", () => {
    expect(buildSignals(input({ role: "kepala_sekolah" }))).toEqual([]);
  });
});
