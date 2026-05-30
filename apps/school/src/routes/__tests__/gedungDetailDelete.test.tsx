import { describe, it, expect } from "vitest";
import { deleteTargetLabel } from "../../components/infrastruktur/deleteTarget";

describe("deleteTargetLabel", () => {
  it("format label hapus", () => {
    expect(deleteTargetLabel({ doctype: "Lantai", name: "GA-L1" })).toBe("Lantai GA-L1");
  });
});
