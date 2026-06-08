import { describe, it, expect } from "vitest";
import {
  filterInbox,
  computeInboxStats,
  stripHtml,
  formatWaktu,
  type InboxRow,
} from "./inbox";

const rows: InboxRow[] = [
  { name: "1", nama: "Budi Santoso", email: "budi@x.id", pesan: "Tanya SPP", status: "Baru" },
  { name: "2", nama: "Ani", email: "ani@x.id", pesan: "Jadwal", status: "Dibalas" },
  { name: "3", nama: "Citra", pesan: "Selesai ya", status: "Selesai" },
];

describe("filterInbox", () => {
  it("matches free text across nama/email/pesan, case-insensitive", () => {
    expect(filterInbox(rows, "budi", "Semua").map((r) => r.name)).toEqual(["1"]);
    expect(filterInbox(rows, "SPP", "Semua").map((r) => r.name)).toEqual(["1"]);
    expect(filterInbox(rows, "ani@x", "Semua").map((r) => r.name)).toEqual(["2"]);
  });

  it("filters by status pill, Semua = no status filter", () => {
    expect(filterInbox(rows, "", "Baru").map((r) => r.name)).toEqual(["1"]);
    expect(filterInbox(rows, "", "Semua")).toHaveLength(3);
  });

  it("combines search and status", () => {
    expect(filterInbox(rows, "jadwal", "Baru")).toHaveLength(0);
    expect(filterInbox(rows, "jadwal", "Dibalas").map((r) => r.name)).toEqual(["2"]);
  });
});

describe("computeInboxStats", () => {
  it("tallies per status", () => {
    expect(computeInboxStats(rows)).toEqual({ total: 3, baru: 1, dibalas: 1, selesai: 1 });
  });
  it("empty inbox", () => {
    expect(computeInboxStats([])).toEqual({ total: 0, baru: 0, dibalas: 0, selesai: 0 });
  });
});

describe("stripHtml", () => {
  it("removes tags and nbsp", () => {
    expect(stripHtml("<p>Halo&nbsp;dunia</p>")).toBe("Halo dunia");
  });
});

describe("formatWaktu", () => {
  it("returns — for empty and raw for unparseable", () => {
    expect(formatWaktu(undefined)).toBe("—");
    expect(formatWaktu("not-a-date")).toBe("not-a-date");
  });
});
