import { describe, it, expect } from "vitest";
import { selectPrimaryRekening } from "../memberActions";

describe("selectPrimaryRekening", () => {
  it("returns undefined for no accounts", () => {
    expect(selectPrimaryRekening([])).toBeUndefined();
  });

  it("returns the only active account", () => {
    expect(
      selectPrimaryRekening([{ name: "REK-1", status: "Aktif", tanggal_buka: "2026-01-01" }]),
    ).toBe("REK-1");
  });

  it("prefers an Aktif account over a Dormant one", () => {
    expect(
      selectPrimaryRekening([
        { name: "REK-DORMANT", status: "Dormant", tanggal_buka: "2026-05-01" },
        { name: "REK-AKTIF", status: "Aktif", tanggal_buka: "2026-01-01" },
      ]),
    ).toBe("REK-AKTIF");
  });

  it("picks the most recently opened among active accounts", () => {
    expect(
      selectPrimaryRekening([
        { name: "REK-OLD", status: "Aktif", tanggal_buka: "2026-01-01" },
        { name: "REK-NEW", status: "Aktif", tanggal_buka: "2026-05-01" },
      ]),
    ).toBe("REK-NEW");
  });

  it("falls back to the most recent account when none are active", () => {
    expect(
      selectPrimaryRekening([
        { name: "REK-OLD", status: "Tutup", tanggal_buka: "2026-01-01" },
        { name: "REK-NEW", status: "Dormant", tanggal_buka: "2026-05-01" },
      ]),
    ).toBe("REK-NEW");
  });
});
