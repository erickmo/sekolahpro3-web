/**
 * Unit tests for the Akademik period-first navigation helpers: TA hub splitting,
 * auto-redirect selection, workspace breadcrumb labelling, and TA path encoding.
 * These back the TA hub + per-TA workspace IA (see 2026-06-03 akademik-ta-hub spec).
 */
import { describe, it, expect } from "vitest";
import {
  splitTaList,
  pickAutoRedirectTa,
  workspaceSubLabel,
  taPath,
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
