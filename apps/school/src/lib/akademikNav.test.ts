/**
 * Unit tests for the Akademik period-first navigation helpers: TA hub splitting,
 * auto-redirect selection, workspace breadcrumb labelling, and TA path encoding.
 * These back the TA hub + per-TA workspace IA (see 2026-06-03 akademik-ta-hub spec).
 *
 * Extends with: workspace nav groups, go-param parser, submodule-path detector,
 * and next-TA picker (Fase 1 single-door spec §1.2–§1.5).
 */
import { describe, it, expect } from "vitest";
import {
  splitTaList,
  pickAutoRedirectTa,
  workspaceSubLabel,
  taPath,
  parseGoParam,
  isSubmodulePath,
  pickNextTa,
  buildWorkspaceNavGroups,
} from "./akademikNav";

describe("splitTaList", () => {
  it("separates running (is_current) from archive", () => {
    const list = [
      { name: "A", is_current: 1 as const },
      { name: "B", is_current: 0 as const },
      { name: "C" },
    ];
    const { berjalan, arsip } = splitTaList(list);
    expect(berjalan.map((t) => t.name)).toEqual(["A"]);
    expect(arsip.map((t) => t.name)).toEqual(["B", "C"]);
  });

  it("returns empty groups for an empty list", () => {
    expect(splitTaList([])).toEqual({ berjalan: [], arsip: [] });
  });
});

describe("pickAutoRedirectTa", () => {
  // Mid school-year reference date: inside 2025/2026, outside earlier years.
  const ref = new Date(2025, 9, 15); // 2025-10-15
  const running = {
    name: "S-2025",
    is_current: 1 as const,
    status: "Aktif",
    tanggal_mulai: "2025-07-01",
    tanggal_selesai: "2026-06-30",
  };
  const closed = {
    name: "S-2024",
    is_current: 0 as const,
    status: "Closed",
    tanggal_mulai: "2024-07-01",
    tanggal_selesai: "2025-06-30",
  };
  const pastWindow = {
    name: "S-2023",
    is_current: 0 as const,
    status: "Aktif",
    tanggal_mulai: "2023-07-01",
    tanggal_selesai: "2024-06-30",
  };
  const list = [running, closed, pastWindow];

  it("returns the stored TA when it is still a writable (non-past) period", () => {
    expect(pickAutoRedirectTa("S-2025", list, ref)).toBe("S-2025");
  });

  it("redirects to the running TA when the stored TA is closed/archived", () => {
    // Beginner landed in an archive last session; never auto-drop them back there.
    expect(pickAutoRedirectTa("S-2024", list, ref)).toBe("S-2025");
  });

  it("redirects to the running TA when the stored TA is past by date window", () => {
    expect(pickAutoRedirectTa("S-2023", list, ref)).toBe("S-2025");
  });

  it("returns null when the stored TA is past and there is no running TA", () => {
    expect(pickAutoRedirectTa("S-2024", [closed, pastWindow], ref)).toBeNull();
  });

  it("returns null when the stored TA is gone (show the hub)", () => {
    expect(pickAutoRedirectTa("S-1999", list, ref)).toBeNull();
  });

  it("returns null when there is no stored TA (first visit → hub)", () => {
    expect(pickAutoRedirectTa(undefined, list, ref)).toBeNull();
  });
});

describe("workspaceSubLabel", () => {
  it("labels the dashboard at the workspace root", () => {
    expect(workspaceSubLabel("/sch/A/akademik/S-2025")).toBe("Dashboard");
  });

  it("labels the grid editor distinctly from the entri-nilai list", () => {
    expect(workspaceSubLabel("/sch/A/akademik/S-2025/entri-nilai/edit")).toBe("Editor Entri Nilai");
    expect(workspaceSubLabel("/sch/A/akademik/S-2025/entri-nilai")).toBe("Entri Nilai");
  });

  it("labels asesmen and raport pages", () => {
    expect(workspaceSubLabel("/sch/A/akademik/S-2025/asesmen")).toBe("Input Nilai Test");
    expect(workspaceSubLabel("/sch/A/akademik/S-2025/raport")).toBe("Raport");
  });
});

describe("taPath", () => {
  it("URL-encodes a TA name containing a slash (e.g. 2025/2026)", () => {
    expect(taPath("SEK-2025/2026")).toBe("SEK-2025%2F2026");
  });

  it("leaves a slug-safe name unchanged", () => {
    expect(taPath("S-2025")).toBe("S-2025");
  });
});

// ── Fase 1 additions ─────────────────────────────────────────────────────────

describe("parseGoParam", () => {
  it("accepts whitelisted module subpaths", () => {
    expect(parseGoParam("kelas")).toBe("kelas");
    expect(parseGoParam("kelas/rombel")).toBe("kelas/rombel");
    expect(parseGoParam("jadwal/papan")).toBe("jadwal/papan");
    expect(parseGoParam("ekskul/program")).toBe("ekskul/program");
  });
  it("rejects unknown roots, absolute URLs, traversal, odd segments", () => {
    expect(parseGoParam("keuangan")).toBeNull();
    expect(parseGoParam("https://evil")).toBeNull();
    expect(parseGoParam("kelas/../pengaturan")).toBeNull();
    expect(parseGoParam("kelas/%2e%2e/x")).toBeNull();
    expect(parseGoParam("kelas//x")).toBeNull();
    expect(parseGoParam("/kelas")).toBeNull();
    expect(parseGoParam("")).toBeNull();
    expect(parseGoParam(undefined)).toBeNull();
  });
  it("returns the DECODED value so encoded separators cannot smuggle into hrefs", () => {
    expect(parseGoParam("kelas%2Fpapan")).toBe("kelas/papan");
    expect(parseGoParam("kelas%2Fpapan%3Ffake%3Dx")).toBeNull();
    expect(parseGoParam("kelas/papan%23frag")).toBeNull();
  });
});

describe("isSubmodulePath", () => {
  it("matches module pages under a TA workspace", () => {
    expect(isSubmodulePath("/sch/a/akademik/2025%2F2026/kelas")).toBe(true);
    expect(isSubmodulePath("/sch/a/akademik/2025%2F2026/jadwal/papan")).toBe(true);
    expect(isSubmodulePath("/sch/a/akademik/2025%2F2026/ekskul")).toBe(true);
  });
  it("does not match workspace dashboard or penilaian pages", () => {
    expect(isSubmodulePath("/sch/a/akademik/2025%2F2026")).toBe(false);
    expect(isSubmodulePath("/sch/a/akademik/2025%2F2026/asesmen")).toBe(false);
  });
});

describe("pickNextTa", () => {
  const rows = [
    { name: "2024/2025", tanggal_mulai: "2024-07-01" },
    { name: "2025/2026", tanggal_mulai: "2025-07-01" },
    { name: "2026/2027", tanggal_mulai: "2026-07-01" },
  ];
  it("returns the nearest TA starting after refDate (local-date string compare)", () => {
    expect(pickNextTa(rows, "2026-06-10")?.name).toBe("2026/2027");
  });
  it("treats a TA starting today as not upcoming", () => {
    expect(pickNextTa(rows, "2026-07-01")).toBeNull();
  });
  it("returns null when none upcoming", () => {
    expect(pickNextTa(rows, "2027-01-01")).toBeNull();
  });
});

describe("buildWorkspaceNavGroups", () => {
  it("contains Pengaturan and Kegiatan groups with module links", () => {
    const groups = buildWorkspaceNavGroups();
    // Fase 2 single-door appended Kehadiran (Absensi) + Penerimaan (Pendaftaran Siswa).
    expect(groups.map((g) => g.label)).toEqual([
      "Ringkasan", "Pengaturan", "Penilaian", "Kegiatan", "Kehadiran", "Penerimaan",
    ]);
    const pengaturan = groups.find((g) => g.label === "Pengaturan")!;
    expect(pengaturan.items.map((i) => i.to)).toEqual([
      "/sch/$sekolah/akademik/$ta/kelas",
      "/sch/$sekolah/akademik/$ta/jadwal/papan",
      "/sch/$sekolah/akademik/$ta/ekskul/program",
    ]);
  });
});

import { buildAkademikModules, activeModuleKey } from "./akademikNav";

describe("unified akademik nav", () => {
  it("activeModuleKey maps each path to its module", () => {
    expect(activeModuleKey("/sch/x/akademik/2025")).toBe("dashboard");
    expect(activeModuleKey("/sch/x/akademik/2025/kelas/daftar")).toBe("kelas");
    expect(activeModuleKey("/sch/x/akademik/2025/jadwal/papan")).toBe("jadwal");
    expect(activeModuleKey("/sch/x/akademik/2025/ekskul/program")).toBe("ekskul");
    expect(activeModuleKey("/sch/x/akademik/2025/absensi/guru")).toBe("absensi");
    expect(activeModuleKey("/sch/x/akademik/2025/asesmen")).toBe("penilaian");
    expect(activeModuleKey("/sch/x/akademik/2025/entri-nilai")).toBe("penilaian");
    expect(activeModuleKey("/sch/x/akademik/2025/raport")).toBe("penilaian");
    expect(activeModuleKey("/sch/x/akademik/2025/pendaftaran")).toBe("pendaftaran");
    expect(activeModuleKey("/sch/x/akademik/ppdb/seleksi")).toBe("ppdb");
  });

  it("buildAkademikModules lists every top entry; ppdb is non-scoped", () => {
    const mods = buildAkademikModules();
    expect(mods.map((m) => m.key)).toEqual([
      "dashboard", "penilaian", "kelas", "jadwal", "ekskul", "absensi", "pendaftaran", "ppdb",
    ]);
    expect(mods.find((m) => m.key === "ppdb")!.scoped).toBe(false);
    expect(mods.find((m) => m.key === "dashboard")!.scoped).toBe(true);
    expect(mods.find((m) => m.key === "dashboard")!.to).toBeTruthy();
    expect((mods.find((m) => m.key === "kelas")!.items ?? []).length).toBeGreaterThan(0);
  });
});
