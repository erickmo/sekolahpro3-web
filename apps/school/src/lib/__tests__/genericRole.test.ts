import { describe, it, expect } from "vitest";
import { genericRoleLabel } from "../genericRole";

// genericRoleLabel is the pure core behind useGenericRoleLabel; tested directly
// so the role-bucket mapping is verified without a session provider.
describe("genericRoleLabel", () => {
  it("defaults to Administrator when the session has no roles (permissive)", () => {
    expect(genericRoleLabel([])).toBe("Administrator");
  });

  it("maps a kepala role to Kepala Sekolah", () => {
    expect(genericRoleLabel(["Kepala Sekolah"])).toBe("Kepala Sekolah");
  });

  it("maps a guru role to Guru", () => {
    expect(genericRoleLabel(["Guru Mapel"])).toBe("Guru");
  });

  it("kepala outranks guru when both are present", () => {
    expect(genericRoleLabel(["Guru", "Kepala Sekolah"])).toBe("Kepala Sekolah");
  });

  it("maps tata usaha to Staf", () => {
    expect(genericRoleLabel(["Tata Usaha"])).toBe("Staf");
  });

  it("maps an administrator role to Administrator", () => {
    expect(genericRoleLabel(["Administrator Sekolah"])).toBe("Administrator");
  });
});
