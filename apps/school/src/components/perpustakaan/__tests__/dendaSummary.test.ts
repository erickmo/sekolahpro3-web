import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDendaSummary, type DendaSummary } from "../dendaSummary";

vi.mock("@sekolahpro/api-client", () => ({
  frappeFetch: vi.fn(),
}));

import { frappeFetch } from "@sekolahpro/api-client";

describe("fetchDendaSummary", () => {
  beforeEach(() => vi.mocked(frappeFetch).mockReset());

  it("returns empty object for empty input", async () => {
    expect(await fetchDendaSummary([])).toEqual({});
    expect(frappeFetch).not.toHaveBeenCalled();
  });

  it("calls whitelisted method and returns mapping", async () => {
    vi.mocked(frappeFetch).mockResolvedValue({
      "LOAN-1": { total: 15000, status_bayar: "Belum Lunas" },
    } as DendaSummary);
    const res = await fetchDendaSummary(["LOAN-1"]);
    expect(frappeFetch).toHaveBeenCalledWith(
      "sekolahpro.perpustakaan.api.denda.get_denda_summary",
      { peminjaman_names: ["LOAN-1"] },
    );
    expect(res["LOAN-1"]!.total).toBe(15000);
  });
});
