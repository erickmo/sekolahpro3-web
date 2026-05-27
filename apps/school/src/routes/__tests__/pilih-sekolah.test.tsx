import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PilihSekolahPage } from "../pilih-sekolah";
import * as data from "../../data/sekolah";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  createFileRoute: () => () => ({}),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const fixture = {
  total_schools: 3,
  org_count: 2,
  groups: [
    {
      organisasi: "org-alpha",
      organisasi_nama: "Org Alpha",
      schools: [
        { sekolah: "SD A1", nama: "SD Alpha 1", logo: null,
          role_sekolah: "Admin", jenis: "Negeri", tingkat: "SD",
          status: "Aktif", subdomain: "alpha-1",
          organisasi: "org-alpha", organisasi_nama: "Org Alpha" },
        { sekolah: "SD A2", nama: "SD Alpha 2", logo: null,
          role_sekolah: "Guru", jenis: "Swasta", tingkat: "SMP",
          status: "Aktif", subdomain: "alpha-2",
          organisasi: "org-alpha", organisasi_nama: "Org Alpha" },
      ],
    },
    {
      organisasi: "org-beta",
      organisasi_nama: "Org Beta",
      schools: [
        { sekolah: "SD B1", nama: "SD Beta 1", logo: null,
          role_sekolah: "Siswa", jenis: "Negeri", tingkat: "SMA",
          status: "Aktif", subdomain: "beta-1",
          organisasi: "org-beta", organisasi_nama: "Org Beta" },
      ],
    },
  ],
};

describe("PilihSekolahPage", () => {
  beforeEach(() => {
    vi.spyOn(data, "useMySchools").mockReturnValue({
      data: fixture, isLoading: false, isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.spyOn(data, "useSelectSchool").mockReturnValue({
      mutate: vi.fn(), isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders one section per organisation", () => {
    wrap(<PilihSekolahPage />);
    expect(screen.getByRole("heading", { name: "Org Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Org Beta" })).toBeInTheDocument();
  });

  it("renders a card for every school", () => {
    wrap(<PilihSekolahPage />);
    expect(screen.getByText("SD Alpha 1")).toBeInTheDocument();
    expect(screen.getByText("SD Alpha 2")).toBeInTheDocument();
    expect(screen.getByText("SD Beta 1")).toBeInTheDocument();
  });
});
