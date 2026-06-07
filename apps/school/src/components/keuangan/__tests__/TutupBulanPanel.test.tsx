import type { ReactNode } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

import { TutupBulanPanel, type CloseStep } from "../TutupBulanPanel";

afterEach(cleanup);

const STEPS: CloseStep[] = [
  { label: "Rekonsiliasi Buku Kas", hint: "Cocokkan saldo kas", to: "/sch/$sekolah/keuangan/kas", status: "todo", statusLabel: "tinjau" },
  { label: "Tinjau Jurnal Belum Posting", hint: "Pastikan semua jurnal diposting", to: "/sch/$sekolah/akuntansi/buku-besar/jurnal", status: "warn", statusLabel: "2 draft" },
  { label: "Tutup Periode", hint: "Kunci periode akuntansi", to: "/sch/$sekolah/akuntansi/referensi/period", status: "done", statusLabel: "siap" },
];

describe("TutupBulanPanel", () => {
  it("renders the ordered close steps with their status + deep-links", () => {
    render(<TutupBulanPanel steps={STEPS} sekolah="x" />);
    expect(screen.getByText("Rekonsiliasi Buku Kas")).toBeTruthy();
    expect(screen.getByText("2 draft")).toBeTruthy();
    const link = screen.getByText("Tutup Periode").closest("a");
    expect(link?.getAttribute("href")).toContain("/akuntansi/referensi/period");
  });

  it("numbers the steps in order", () => {
    render(<TutupBulanPanel steps={STEPS} sekolah="x" />);
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });
});
