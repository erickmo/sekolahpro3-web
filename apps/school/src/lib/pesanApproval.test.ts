import { describe, it, expect } from "vitest";
import {
  PESAN_WORKFLOW_STATE,
  deriveBroadcastGate,
  pesanStateBadgeTone,
  isKepsekApprover,
} from "./pesanApproval";

const KEPSEK = ["Kepala Sekolah"];
const STAFF = ["Tata Usaha"];

describe("isKepsekApprover", () => {
  it("true for Kepala Sekolah / System Manager", () => {
    expect(isKepsekApprover(KEPSEK)).toBe(true);
    expect(isKepsekApprover(["System Manager"])).toBe(true);
  });
  it("false for ordinary staff", () => {
    expect(isKepsekApprover(STAFF)).toBe(false);
  });
});

describe("deriveBroadcastGate — single Kepsek gate", () => {
  it("Draf is unlocked, no approval bar", () => {
    const g = deriveBroadcastGate(PESAN_WORKFLOW_STATE.DRAF, KEPSEK);
    expect(g.isLocked).toBe(false);
    expect(g.showApprovalBar).toBe(false);
    expect(g.canApprove).toBe(false);
  });

  it("Menunggu Kepsek shows the bar; a kepsek may approve", () => {
    const g = deriveBroadcastGate(PESAN_WORKFLOW_STATE.MENUNGGU_KEPSEK, KEPSEK);
    expect(g.isLocked).toBe(true);
    expect(g.showApprovalBar).toBe(true);
    expect(g.canApprove).toBe(true);
    expect(g.blockReason).toBeUndefined();
  });

  it("Menunggu Kepsek shows the bar but blocks a non-kepsek with a reason", () => {
    const g = deriveBroadcastGate(PESAN_WORKFLOW_STATE.MENUNGGU_KEPSEK, STAFF);
    expect(g.showApprovalBar).toBe(true);
    expect(g.canApprove).toBe(false);
    expect(g.blockReason).toBeTruthy();
  });

  it("approved/rejected are locked with no approval bar", () => {
    expect(deriveBroadcastGate(PESAN_WORKFLOW_STATE.DISETUJUI, KEPSEK).showApprovalBar).toBe(false);
    expect(deriveBroadcastGate(PESAN_WORKFLOW_STATE.DITOLAK, KEPSEK).showApprovalBar).toBe(false);
    expect(deriveBroadcastGate(PESAN_WORKFLOW_STATE.DISETUJUI, KEPSEK).isLocked).toBe(true);
  });
});

describe("pesanStateBadgeTone", () => {
  it("maps each state to a tone", () => {
    expect(pesanStateBadgeTone(PESAN_WORKFLOW_STATE.DISETUJUI)).toBe("success");
    expect(pesanStateBadgeTone(PESAN_WORKFLOW_STATE.DITOLAK)).toBe("danger");
    expect(pesanStateBadgeTone(PESAN_WORKFLOW_STATE.DRAF)).toBe("neutral");
    expect(pesanStateBadgeTone(PESAN_WORKFLOW_STATE.MENUNGGU_KEPSEK)).toBe("warning");
  });
});
