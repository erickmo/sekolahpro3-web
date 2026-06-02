import { describe, it, expect } from "vitest";
import {
  deriveOnboardingStep,
  canProceedToPokok,
  nextStepLabel,
  onboardingSteps,
  type OnboardingState,
} from "../onboarding";

describe("deriveOnboardingStep", () => {
  it("starts at nasabah when nothing chosen", () => {
    expect(deriveOnboardingStep({})).toBe("nasabah");
  });

  it("moves to keanggotaan once nasabah picked", () => {
    expect(deriveOnboardingStep({ nasabah: "NSB-1" })).toBe("keanggotaan");
  });

  it("moves to rekening once anggota created", () => {
    expect(deriveOnboardingStep({ nasabah: "NSB-1", anggotaName: "ANG-1" })).toBe("rekening");
  });

  it("moves to pokok once rekening exists", () => {
    expect(
      deriveOnboardingStep({ nasabah: "NSB-1", anggotaName: "ANG-1", rekeningName: "REK-1" }),
    ).toBe("pokok");
  });

  it("reaches selesai once pokok paid", () => {
    expect(
      deriveOnboardingStep({
        nasabah: "NSB-1",
        anggotaName: "ANG-1",
        rekeningName: "REK-1",
        pokokPaid: true,
      }),
    ).toBe("selesai");
  });
});

describe("canProceedToPokok", () => {
  it("allows when rekening is Aktif", () => {
    expect(canProceedToPokok({ rekeningStatus: "Aktif" })).toBe(true);
  });

  it("allows when permohonan is Disetujui", () => {
    expect(canProceedToPokok({ rekeningStatus: "Disetujui" })).toBe(true);
  });

  it("blocks when rekening is still pending/diajukan", () => {
    expect(canProceedToPokok({ rekeningStatus: "Diajukan" })).toBe(false);
  });

  it("blocks when status unknown", () => {
    expect(canProceedToPokok({})).toBe(false);
  });
});

describe("nextStepLabel", () => {
  it("describes the next action for an empty state", () => {
    expect(nextStepLabel({})).toMatch(/nasabah/i);
  });

  it("describes completion when done", () => {
    const done: OnboardingState = {
      nasabah: "NSB-1",
      anggotaName: "ANG-1",
      rekeningName: "REK-1",
      pokokPaid: true,
    };
    expect(nextStepLabel(done)).toMatch(/selesai/i);
  });
});

describe("onboardingSteps", () => {
  it("marks completed steps done and the active step current", () => {
    const steps = onboardingSteps({ nasabah: "NSB-1" });
    const byKey = Object.fromEntries(steps.map((s) => [s.key, s.status]));
    expect(byKey.nasabah).toBe("done");
    expect(byKey.keanggotaan).toBe("current");
    expect(byKey.rekening).toBe("pending");
  });

  it("returns one entry per wizard step in order", () => {
    const steps = onboardingSteps({});
    expect(steps.map((s) => s.key)).toEqual(["nasabah", "keanggotaan", "rekening", "pokok"]);
  });
});
