import { describe, it, expect } from "vitest";
import { bebanToCsv } from "./jadwalExport";

describe("bebanToCsv", () => {
  it("menulis header + baris dengan status Cukup/Kurang", () => {
    const csv = bebanToCsv([
      { guru: "G1", total_menit: 1080, jtm: 24 },
      { guru: "G2", total_menit: 450, jtm: 10 },
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Guru,Total Menit,JTM,Status");
    expect(lines[1]).toBe("G1,1080,24,Cukup");
    expect(lines[2]).toBe("G2,450,10,Kurang");
  });

  it("meng-escape sel yang mengandung koma", () => {
    const csv = bebanToCsv([{ guru: "Budi, S.Pd", total_menit: 90, jtm: 2 }]);
    expect(csv.split("\n")[1]).toBe('"Budi, S.Pd",90,2,Kurang');
  });
});
