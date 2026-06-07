import { describe, it, expect } from "vitest";
import {
  isKatu,
  isKepsek,
  canViewAudit,
  deriveApprovalGate,
  stateBadgeTone,
  deriveApprovalSteps,
} from "./kelasApproval";

describe("kelasApproval — role predicates", () => {
  it("recognizes Ka-TU and System Manager as Ka-TU approvers", () => {
    expect(isKatu(["Kepala Tata Usaha"])).toBe(true);
    expect(isKatu(["System Manager"])).toBe(true);
    expect(isKatu(["Kepala Sekolah"])).toBe(false);
  });

  it("recognizes Kepsek and System Manager as Kepsek approvers", () => {
    expect(isKepsek(["Kepala Sekolah"])).toBe(true);
    expect(isKepsek(["System Manager"])).toBe(true);
    expect(isKepsek(["Kepala Tata Usaha"])).toBe(false);
  });

  it("limits audit visibility to Kepsek, BK, and System Manager", () => {
    expect(canViewAudit(["Bimbingan Konseling"])).toBe(true);
    expect(canViewAudit(["Wali Kelas"])).toBe(false);
  });
});

describe("kelasApproval — gate derivation", () => {
  it("lets Ka-TU approve at Pending Ka-TU", () => {
    const g = deriveApprovalGate("Pending Ka-TU", ["Kepala Tata Usaha"]);
    expect(g.canApproveKatu).toBe(true);
    expect(g.canApprove).toBe(true);
    expect(g.approveLabel).toBe("Setujui sebagai Ka-TU");
    expect(g.showApprovalBar).toBe(true);
    expect(g.isLocked).toBe(true);
    expect(g.blockReason).toBeUndefined();
  });

  it("lets Kepsek approve at Pending Kepsek", () => {
    const g = deriveApprovalGate("Pending Kepsek", ["Kepala Sekolah"]);
    expect(g.canApproveKepsek).toBe(true);
    expect(g.approveLabel).toBe("Setujui sebagai Kepala Sekolah");
  });

  it("blocks the wrong role with an explanatory reason", () => {
    const g = deriveApprovalGate("Pending Kepsek", ["Kepala Tata Usaha"]);
    expect(g.canApprove).toBe(false);
    expect(g.blockReason).toBe("Hanya Kepala Sekolah yang dapat menyetujui pada tahap ini.");
  });

  it("treats Draft as unlocked with no approval bar", () => {
    const g = deriveApprovalGate("Draft", []);
    expect(g.isLocked).toBe(false);
    expect(g.showApprovalBar).toBe(false);
    expect(g.canApprove).toBe(false);
  });

  it("shows no approval bar once Approved", () => {
    const g = deriveApprovalGate("Approved", ["Kepala Sekolah"]);
    expect(g.showApprovalBar).toBe(false);
    expect(g.canApprove).toBe(false);
  });
});

describe("kelasApproval — presentation helpers", () => {
  it("maps workflow state to a badge tone", () => {
    expect(stateBadgeTone("Approved")).toBe("success");
    expect(stateBadgeTone("Rejected")).toBe("danger");
    expect(stateBadgeTone("Draft")).toBe("neutral");
    expect(stateBadgeTone("Pending Kepsek")).toBe("warning");
  });

  it("builds 4 stepper segments with a caller-supplied final label", () => {
    const steps = deriveApprovalSteps("Pending Kepsek", "Disahkan");
    expect(steps).toHaveLength(4);
    expect(steps[3]?.label).toBe("Disahkan");
    expect(steps[2]?.status).toBe("current");
  });
});
