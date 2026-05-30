// vitest.config sets globals:false → import test API explicitly.
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PilihSekolahPage } from "../pilih-sekolah";
import * as data from "../../data/sekolah";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  createFileRoute: () => () => ({}),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const school = {
  sekolah: "S1", nama: "Sek 1", logo: null,
  role_sekolah: "Admin", jenis: "Negeri", tingkat: "SD",
  status: "Aktif", subdomain: "s1",
  organisasi: "O1", organisasi_nama: "Org 1", slug: "s1",
};

const koperasi = {
  koperasi: "KOP-O1-0001", nama: "Koperasi YPKI", slug: "s1",
  role_koperasi: "Teller", logo: null, status: "Aktif",
  organisasi: "O1", organisasi_nama: "Org 1",
};

function mockData(koperasiList: data.KoperasiCard[]) {
  vi.spyOn(data, "useMySchools").mockReturnValue({
    data: {
      total_schools: 1, org_count: 1,
      groups: [{ organisasi: "O1", organisasi_nama: "Org 1", schools: [school] }],
      onboarding: null, footer: null,
      koperasi: koperasiList, koperasi_count: koperasiList.length,
    },
    isLoading: false, isError: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  vi.spyOn(data, "useSelectSchool").mockReturnValue({
    mutate: vi.fn(), isPending: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

describe("PilihSekolahPage koperasi", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    navigate.mockReset();
  });

  it("renders a koperasi card with its per-school name + role", () => {
    mockData([koperasi]);
    vi.spyOn(data, "useSelectKoperasi").mockReturnValue({
      mutate: vi.fn(), isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<PilihSekolahPage />);
    expect(screen.getByText("Koperasi YPKI")).toBeInTheDocument();
    expect(screen.getByText("Teller")).toBeInTheDocument();
  });

  it("does not render the Koperasi section when there are none", () => {
    mockData([]);
    vi.spyOn(data, "useSelectKoperasi").mockReturnValue({
      mutate: vi.fn(), isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<PilihSekolahPage />);
    expect(screen.queryByRole("heading", { name: "Koperasi" })).toBeNull();
  });

  it("clicking a koperasi card calls selectKoperasi with the koperasi name", () => {
    const mutate = vi.fn();
    mockData([koperasi]);
    vi.spyOn(data, "useSelectKoperasi").mockReturnValue({
      mutate, isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<PilihSekolahPage />);
    fireEvent.click(screen.getByText("Koperasi YPKI").closest("button")!);
    expect(mutate).toHaveBeenCalledWith(
      { name: "KOP-O1-0001" },
      expect.any(Object),
    );
  });

  it("navigates to the top-level /$koperasi route on select success", () => {
    const mutate = vi.fn();
    mockData([koperasi]);
    vi.spyOn(data, "useSelectKoperasi").mockReturnValue({
      mutate, isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<PilihSekolahPage />);
    fireEvent.click(screen.getByText("Koperasi YPKI").closest("button")!);

    // Invoke the onSuccess callback the page passed to selectKoperasi.mutate
    // with a SelectKoperasiResponse to exercise the navigation branch.
    const opts = mutate.mock.calls[0][1] as {
      onSuccess: (resp: data.SelectKoperasiResponse) => void;
    };
    opts.onSuccess({
      ok: true,
      koperasi: "KOP-O1-0001",
      sekolah: "S1",
      nama: "Koperasi YPKI",
      slug: "ypki",
      role: "Teller",
    });

    expect(navigate).toHaveBeenCalledWith({
      to: "/$koperasi",
      params: { koperasi: "ypki" },
    });
  });
});
