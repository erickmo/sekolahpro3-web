import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StrukturBiayaView } from "../sch.$sekolah.keuangan.biaya";
import type { FeeComponent } from "../../data/fee-structure";

afterEach(cleanup);

const COMPONENTS: FeeComponent[] = [
  {
    name: "FEE-SPP",
    nama_komponen: "SPP",
    ritme: "Bulanan",
    tahun_ajaran: "2025/2026",
    due_day: 10,
    auto_generate: true,
    is_active: true,
    rates: [{ tingkat: 1, nominal: 250000 }],
  },
];

describe("StrukturBiayaView", () => {
  it("lists components with ritme + per-tingkat rates", () => {
    render(<StrukturBiayaView components={COMPONENTS} canManage onGenerate={() => {}} />);
    expect(screen.getByText("SPP")).toBeTruthy();
    expect(screen.getByText("Bulanan")).toBeTruthy();
    expect(screen.getByText(/Tingkat 1/)).toBeTruthy();
  });

  it("hides manage actions when canManage is false", () => {
    render(<StrukturBiayaView components={COMPONENTS} canManage={false} onGenerate={() => {}} />);
    expect(screen.queryByRole("button", { name: /generate tagihan/i })).toBeNull();
  });
});
