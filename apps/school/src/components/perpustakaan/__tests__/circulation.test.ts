// PERP-GAP-02 | PERP-GAP-25 | PERP-GAP-26 | ADR: PERP-ADR-0001
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sekolahpro/api-client", () => ({ frappeFetch: vi.fn() }));
import { frappeFetch } from "@sekolahpro/api-client";
import { insertAndSubmit } from "../circulation";

describe("insertAndSubmit", () => {
  beforeEach(() => {
    vi.mocked(frappeFetch).mockReset();
  });

  it("inserts a draft then submits it so on_submit hooks run", async () => {
    vi.mocked(frappeFetch)
      .mockResolvedValueOnce({ name: "RET-1" })
      .mockResolvedValueOnce({ name: "RET-1", docstatus: 1 });

    const out = await insertAndSubmit("Pengembalian Buku", { peminjaman: "LOAN-1" });

    expect(out).toEqual({ name: "RET-1", docstatus: 1 });
    expect(frappeFetch).toHaveBeenNthCalledWith(1, "frappe.client.insert", {
      doc: { doctype: "Pengembalian Buku", peminjaman: "LOAN-1" },
    });
    expect(frappeFetch).toHaveBeenNthCalledWith(2, "frappe.client.submit", {
      doc: { doctype: "Pengembalian Buku", name: "RET-1" },
    });
  });

  it("does not submit when the insert rejects", async () => {
    vi.mocked(frappeFetch).mockRejectedValueOnce(new Error("boom"));
    await expect(insertAndSubmit("Peminjaman Buku", {})).rejects.toThrow("boom");
    expect(frappeFetch).toHaveBeenCalledTimes(1);
  });
});
