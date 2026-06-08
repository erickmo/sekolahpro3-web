import { describe, it, expect } from "vitest";
import {
  deriveCommHealth,
  DEFAULT_SLA_JAM,
  type CommHealthRow,
} from "./pesanSla";

// Fixed reference "now" so the pure function is deterministic.
const NOW = Date.parse("2026-06-08T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 3600_000).toISOString();

describe("deriveCommHealth", () => {
  it("all replied/resolved → SEHAT, zero signals", () => {
    const rows: CommHealthRow[] = [
      { status: "Dibalas", submitted_at: hoursAgo(50) },
      { status: "Selesai", submitted_at: hoursAgo(99) },
    ];
    const h = deriveCommHealth(rows, 24, NOW);
    expect(h.belumDibalas).toBe(0);
    expect(h.lewatSla).toBe(0);
    expect(h.terlamaMenungguJam).toBe(0);
    expect(h.verdict).toBe("SEHAT");
  });

  it("an unanswered message within SLA → PERLU PERHATIAN (not yet overdue)", () => {
    const rows: CommHealthRow[] = [{ status: "Baru", submitted_at: hoursAgo(3) }];
    const h = deriveCommHealth(rows, 24, NOW);
    expect(h.belumDibalas).toBe(1);
    expect(h.lewatSla).toBe(0);
    expect(h.terlamaMenungguJam).toBe(3);
    expect(h.verdict).toBe("PERLU PERHATIAN");
  });

  it("an unanswered message past the SLA window → TERLAMBAT", () => {
    const rows: CommHealthRow[] = [
      { status: "Baru", submitted_at: hoursAgo(30) },
      { status: "Baru", submitted_at: hoursAgo(2) },
    ];
    const h = deriveCommHealth(rows, 24, NOW);
    expect(h.belumDibalas).toBe(2);
    expect(h.lewatSla).toBe(1);
    expect(h.terlamaMenungguJam).toBe(30);
    expect(h.verdict).toBe("TERLAMBAT");
  });

  it("only counts SLA age for unanswered (Baru) rows, not replied ones", () => {
    const rows: CommHealthRow[] = [{ status: "Dibalas", submitted_at: hoursAgo(99) }];
    const h = deriveCommHealth(rows, 24, NOW);
    expect(h.belumDibalas).toBe(0);
    expect(h.lewatSla).toBe(0);
    expect(h.verdict).toBe("SEHAT");
  });

  it("falls back to creation when submitted_at is absent", () => {
    const rows: CommHealthRow[] = [{ status: "Baru", creation: hoursAgo(40) }];
    const h = deriveCommHealth(rows, 24, NOW);
    expect(h.terlamaMenungguJam).toBe(40);
    expect(h.lewatSla).toBe(1);
  });

  it("ignores rows with no parseable timestamp (counts as belum, age 0)", () => {
    const rows: CommHealthRow[] = [{ status: "Baru" }];
    const h = deriveCommHealth(rows, 24, NOW);
    expect(h.belumDibalas).toBe(1);
    expect(h.terlamaMenungguJam).toBe(0);
    expect(h.lewatSla).toBe(0);
    expect(h.verdict).toBe("PERLU PERHATIAN");
  });

  it("empty inbox → SEHAT", () => {
    expect(deriveCommHealth([], 24, NOW).verdict).toBe("SEHAT");
  });

  it("uses DEFAULT_SLA_JAM when slaJam omitted", () => {
    expect(DEFAULT_SLA_JAM).toBe(24);
    const rows: CommHealthRow[] = [{ status: "Baru", submitted_at: hoursAgo(25) }];
    const h = deriveCommHealth(rows, undefined, NOW);
    expect(h.lewatSla).toBe(1);
  });
});
