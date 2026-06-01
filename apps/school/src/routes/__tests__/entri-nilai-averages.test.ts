/**
 * Unit test for the entri-nilai mapel comparison aggregation.
 *
 * Covers AKA-19: average nilai_akhir per mata pelajaran, sorted, skipping
 * ungraded rows and capping the number of bars.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: vi.fn(() => ({ data: [], isLoading: false })),
  listResource: vi.fn().mockResolvedValue([]),
}));

import { buildMapelAverages } from "../sch.$sekolah.akademik.entri-nilai";

describe("buildMapelAverages", () => {
  it("averages nilai_akhir per mapel, highest first", () => {
    const out = buildMapelAverages([
      { mata_pelajaran: "MTK", nilai_akhir: 80 },
      { mata_pelajaran: "MTK", nilai_akhir: 90 },
      { mata_pelajaran: "IPA", nilai_akhir: 70 },
    ]);
    expect(out).toEqual([
      { label: "MTK", value: 85 },
      { label: "IPA", value: 70 },
    ]);
  });

  it("skips rows without a numeric nilai_akhir and drops fully-ungraded mapel", () => {
    const out = buildMapelAverages([
      { mata_pelajaran: "IPS" },
      { mata_pelajaran: "MTK", nilai_akhir: 60 },
    ]);
    expect(out).toEqual([{ label: "MTK", value: 60 }]);
  });

  it("rounds the average to one decimal", () => {
    const out = buildMapelAverages([
      { mata_pelajaran: "B", nilai_akhir: 81 },
      { mata_pelajaran: "B", nilai_akhir: 82 },
    ]);
    expect(out).toEqual([{ label: "B", value: 81.5 }]);
  });

  it("returns an empty array when there are no graded rows", () => {
    expect(buildMapelAverages([])).toEqual([]);
  });

  it("caps the number of bars at the configured maximum", () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      mata_pelajaran: `Mapel-${i}`,
      nilai_akhir: i,
    }));
    expect(buildMapelAverages(rows)).toHaveLength(8);
  });
});
