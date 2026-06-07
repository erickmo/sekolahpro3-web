import { describe, it, expect } from "vitest";
import { buildWorkQueue, inboxProgress, type WorkQueueInput } from "./keuanganWorkQueue";
import type { TagihanRow, PengeluaranRow } from "../data/keuangan";

function tagihan(p: Partial<TagihanRow>): TagihanRow {
  return {
    id: "T1",
    siswa: "Budi",
    kelas: "X-A",
    judul: "SPP Juni",
    jatuhTempo: "2026-06-01",
    jumlah: 1_000_000,
    dibayar: 0,
    status: "Tertunda",
    tahunAjaran: "2025/2026",
    sekolah: "" as TagihanRow["sekolah"],
    ...p,
  };
}

function pengeluaran(p: Partial<PengeluaranRow>): PengeluaranRow {
  return {
    id: "E1",
    tanggal: "2026-06-05",
    kategori: "Operasional",
    deskripsi: "Beli kertas",
    jumlah: 500_000,
    penerima: "Toko ATK",
    metode: "Tunai",
    status: "Approval",
    sekolah: "" as PengeluaranRow["sekolah"],
    ...p,
  };
}

const base: Omit<WorkQueueInput, "tagihan" | "pengeluaran"> = { sptDraftCount: 0, today: "2026-06-10" };

describe("buildWorkQueue", () => {
  it("turns an overdue invoice into a red tagihan item deep-linking to the list", () => {
    const items = buildWorkQueue({ ...base, tagihan: [tagihan({ jatuhTempo: "2026-06-01" })], pengeluaran: [] });
    expect(items).toHaveLength(1);
    expect(items[0]!.type).toBe("tagihan");
    expect(items[0]!.severity).toBe("red");
    expect(items[0]!.amount).toBe(1_000_000); // jumlah - dibayar
    expect(items[0]!.to).toContain("/keuangan/tagihan");
    expect(items[0]!.dueLabel).toMatch(/telat/);
  });

  it("includes a due-soon invoice as amber (within 7 days, not overdue)", () => {
    const items = buildWorkQueue({ ...base, tagihan: [tagihan({ jatuhTempo: "2026-06-16" })], pengeluaran: [] });
    expect(items[0]!.severity).toBe("amber");
    expect(items[0]!.dueLabel).toMatch(/jatuh tempo/);
  });

  it("excludes paid / cancelled invoices and far-future ones", () => {
    const items = buildWorkQueue({
      ...base,
      tagihan: [
        tagihan({ id: "A", status: "Lunas", jatuhTempo: "2026-06-01" }),
        tagihan({ id: "B", status: "Dibatalkan", jatuhTempo: "2026-06-01" }),
        tagihan({ id: "C", status: "Tertunda", jatuhTempo: "2026-09-01" }),
      ],
      pengeluaran: [],
    });
    expect(items).toHaveLength(0);
  });

  it("turns an expense awaiting approval into a belanja item; ignores paid", () => {
    const items = buildWorkQueue({
      ...base,
      tagihan: [],
      pengeluaran: [pengeluaran({ id: "E1", status: "Approval" }), pengeluaran({ id: "E2", status: "Dibayar" })],
    });
    expect(items).toHaveLength(1);
    expect(items[0]!.type).toBe("belanja");
    expect(items[0]!.id).toBe("E1");
    expect(items[0]!.to).toContain("/keuangan/pengeluaran");
  });

  it("adds one aggregate pajak item when SPT drafts exist", () => {
    const items = buildWorkQueue({ ...base, sptDraftCount: 2, tagihan: [], pengeluaran: [] });
    expect(items).toHaveLength(1);
    expect(items[0]!.type).toBe("pajak");
    expect(items[0]!.label).toContain("2");
    expect(items[0]!.to).toContain("/akuntansi/pajak/spt-ppn");
  });

  it("sorts by severity then amount desc", () => {
    const items = buildWorkQueue({
      ...base,
      tagihan: [
        tagihan({ id: "small", jumlah: 200_000, jatuhTempo: "2026-06-01" }),
        tagihan({ id: "big", jumlah: 900_000, jatuhTempo: "2026-06-01" }),
      ],
      pengeluaran: [],
    });
    expect(items.map((i) => i.id)).toEqual(["big", "small"]);
  });

  it("floats the role-relevant type to the top without filtering others out", () => {
    const items = buildWorkQueue({
      ...base,
      role: "akuntan",
      sptDraftCount: 1,
      tagihan: [tagihan({ id: "overdue", jatuhTempo: "2026-06-01" })], // red
      pengeluaran: [],
    });
    expect(items[0]!.type).toBe("pajak"); // akuntan's domain floats above the red tagihan
    expect(items).toHaveLength(2); // nothing filtered
  });

  it("returns an empty queue for empty inputs", () => {
    expect(buildWorkQueue({ ...base, tagihan: [], pengeluaran: [] })).toEqual([]);
  });
});

describe("inboxProgress", () => {
  it("counts done vs total by id", () => {
    const items = buildWorkQueue({
      ...base,
      tagihan: [tagihan({ id: "a", jatuhTempo: "2026-06-01" }), tagihan({ id: "b", jatuhTempo: "2026-06-01" })],
      pengeluaran: [],
    });
    expect(inboxProgress(items, ["a"])).toEqual({ done: 1, total: 2 });
  });
});
