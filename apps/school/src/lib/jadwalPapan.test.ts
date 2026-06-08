import { describe, it, expect } from "vitest";
import {
  bandsFromSlots,
  bolehTerbitkan,
  slotsTanpaGuru,
  tanpaSlot,
  toSlotsPayload,
  withTambahanSlot,
  type PapanSlot,
} from "./jadwalPapan";

const SLOT_A: PapanSlot = { name: "r1", hari: "Senin", jam_mulai: "07:00:00", jam_selesai: "08:00:00", guru: "G1", mata_pelajaran: "M1" };
const SLOT_B: PapanSlot = { name: "r2", hari: "Selasa", jam_mulai: "07:00:00", jam_selesai: "08:00:00", guru: null, mata_pelajaran: "M1" };

describe("bandsFromSlots", () => {
  it("dedup band sama lalu urut jam mulai", () => {
    const bands = bandsFromSlots([SLOT_A, SLOT_B, { ...SLOT_A, hari: "Rabu", jam_mulai: "09:00:00", jam_selesai: "10:00:00" }]);
    expect(bands.map((b) => b.jam_mulai)).toEqual(["07:00:00", "09:00:00"]);
  });
});

describe("slotsTanpaGuru / bolehTerbitkan", () => {
  it("menghitung slot tanpa guru", () => {
    expect(slotsTanpaGuru([SLOT_A, SLOT_B])).toBe(1);
  });
  it("boleh terbit hanya bila ada slot dan semua berguru", () => {
    expect(bolehTerbitkan([SLOT_A])).toBe(true);
    expect(bolehTerbitkan([SLOT_A, SLOT_B])).toBe(false);
    expect(bolehTerbitkan([])).toBe(false);
  });
});

describe("toSlotsPayload / withTambahanSlot / tanpaSlot", () => {
  it("mempertahankan docname existing dan default tipe Reguler", () => {
    const payload = toSlotsPayload([SLOT_A]);
    expect(payload[0]).toMatchObject({ name: "r1", tipe: "Reguler", guru: "G1" });
  });

  it("withTambahanSlot menambah baris baru tanpa name", () => {
    const baru: PapanSlot = { hari: "Kamis", jam_mulai: "07:00:00", jam_selesai: "08:00:00", guru: "G2", mata_pelajaran: "M2" };
    const payload = withTambahanSlot([SLOT_A], baru);
    expect(payload).toHaveLength(2);
    expect(payload[1]).not.toHaveProperty("name");
  });

  it("tanpaSlot membuang baris pada index", () => {
    const payload = tanpaSlot([SLOT_A, SLOT_B], 0);
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({ name: "r2" });
  });
});
