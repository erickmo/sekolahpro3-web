import { describe, it, expect } from "vitest";
import { mapComponentDoc, type FeeComponentDoc } from "./fee-structure-live";

describe("mapComponentDoc", () => {
  it("maps doc + child rates and coerces checks to boolean", () => {
    const doc: FeeComponentDoc = {
      name: "FEE-x",
      nama_komponen: "SPP",
      ritme: "Bulanan",
      tahun_ajaran: "sd-x-2025/2026",
      due_day: 10,
      auto_generate: 1,
      is_active: 1,
      rates: [{ tingkat: 1, nominal: 100000 }],
    };
    const ui = mapComponentDoc(doc);
    expect(ui.auto_generate).toBe(true);
    expect(ui.is_active).toBe(true);
    expect(ui.rates[0].nominal).toBe(100000);
  });

  it("omits jenjang when absent", () => {
    const doc: FeeComponentDoc = {
      name: "FEE-y",
      nama_komponen: "Seragam",
      ritme: "Sekali",
      tahun_ajaran: "sd-x-2025/2026",
      due_day: 10,
      auto_generate: 0,
      is_active: 0,
      rates: [],
    };
    const ui = mapComponentDoc(doc);
    expect("jenjang" in ui).toBe(false);
    expect(ui.is_active).toBe(false);
    expect(ui.rates).toEqual([]);
  });
});
