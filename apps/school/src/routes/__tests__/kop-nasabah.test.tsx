// vitest.config sets globals:false → import test API explicitly.
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as apiClient from "@sekolahpro/api-client";
import { NasabahListView } from "../kop.$sekolah.nasabah";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useParams: () => ({ sekolah: "kop-demo" }),
  createFileRoute: () => (opts: unknown) => opts,
  Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const ROWS = [
  {
    name: "NSB-0001",
    nomor_nasabah: "NSB-0001",
    pihak_tipe: "Siswa",
    pihak: "S-001",
    status: "Aktif",
    is_anggota: 1,
    kyc_tier: "High",
    kyc_review_overdue: 1,
    tanggal_registrasi: "2026-06-01",
  },
];

describe("NasabahListView", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    navigate.mockReset();
    window.localStorage.clear();
  });

  it("renders nasabah rows with KYC badges from the live query", () => {
    vi.spyOn(apiClient, "useResourceList").mockReturnValue({
      data: ROWS,
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<NasabahListView />);
    expect(screen.getAllByText("NSB-0001").length).toBeGreaterThan(0);
    // "High" juga muncul sebagai opsi filter — pastikan ≥2 (badge baris + opsi).
    expect(screen.getAllByText("High").length).toBeGreaterThan(1);
    expect(screen.getByText("Overdue")).toBeTruthy();
    expect(screen.getByText("Daftarkan Nasabah")).toBeTruthy();
  });

  it("pins the overdue worklist deep-link to the kyc_review_overdue filter", () => {
    const spy = vi.spyOn(apiClient, "useResourceList").mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<NasabahListView overdue />);
    expect(screen.getByText("Nasabah — Review KYC Overdue")).toBeTruthy();
    const nasabahCall = spy.mock.calls.find(([dt]) => dt === "Nasabah");
    expect(nasabahCall).toBeTruthy();
    const params = nasabahCall![1] as { filters?: unknown[] };
    expect(JSON.stringify(params.filters)).toContain('["kyc_review_overdue","=",1]');
  });
});
