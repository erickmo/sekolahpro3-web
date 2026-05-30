import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PilihSekolahPage } from "../pilih";
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
          organisasi: "org-alpha", organisasi_nama: "Org Alpha",
          slug: "sd-a1" },
        { sekolah: "SD A2", nama: "SD Alpha 2", logo: null,
          role_sekolah: "Guru", jenis: "Swasta", tingkat: "SMP",
          status: "Aktif", subdomain: "alpha-2",
          organisasi: "org-alpha", organisasi_nama: "Org Alpha",
          slug: "sd-a2" },
      ],
    },
    {
      organisasi: "org-beta",
      organisasi_nama: "Org Beta",
      schools: [
        { sekolah: "SD B1", nama: "SD Beta 1", logo: null,
          role_sekolah: "Siswa", jenis: "Negeri", tingkat: "SMA",
          status: "Aktif", subdomain: "beta-1",
          organisasi: "org-beta", organisasi_nama: "Org Beta",
          slug: "sd-b1" },
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

describe("PilihSekolahPage filters", () => {
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

  it("org chip hides other groups", async () => {
    wrap(<PilihSekolahPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Org Alpha" }));
    expect(screen.queryByRole("heading", { name: "Org Beta" })).toBeNull();
  });

  it("search input filters by nama (debounced)", async () => {
    wrap(<PilihSekolahPage />);
    fireEvent.change(screen.getByLabelText("Cari sekolah"), {
      target: { value: "Beta" },
    });
    await waitFor(
      () => expect(screen.queryByText("SD Alpha 1")).toBeNull(),
      { timeout: 800 },
    );
    expect(screen.getByText("SD Beta 1")).toBeInTheDocument();
  });

  it("shows empty state when no schools match filter", async () => {
    wrap(<PilihSekolahPage />);
    fireEvent.change(screen.getByLabelText("Cari sekolah"), {
      target: { value: "ZZZNONE" },
    });
    await waitFor(() =>
      expect(screen.getByText("Tidak ada sekolah cocok")).toBeInTheDocument(),
    );
  });
});

describe("PilihSekolahPage selection", () => {
  beforeEach(() => {
    vi.spyOn(data, "useMySchools").mockReturnValue({
      data: fixture, isLoading: false, isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("clicking a card calls selectSchool with sekolah name", () => {
    const mutate = vi.fn();
    vi.spyOn(data, "useSelectSchool").mockReturnValue({
      mutate, isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<PilihSekolahPage />);
    fireEvent.click(screen.getByText("SD Beta 1").closest("button")!);
    expect(mutate).toHaveBeenCalledWith(
      { name: "SD B1" },
      expect.any(Object),
    );
  });
});

describe("PilihSekolahPage single-school auto-redirect", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("auto-selects when only one school", () => {
    const mutate = vi.fn();
    vi.spyOn(data, "useMySchools").mockReturnValue({
      data: {
        total_schools: 1,
        org_count: 1,
        groups: [{
          organisasi: "org-only", organisasi_nama: "Org Only",
          schools: [{
            sekolah: "Only", nama: "Only School", logo: null,
            role_sekolah: "Admin", jenis: null, tingkat: null,
            status: "Aktif", subdomain: "only",
            organisasi: "org-only", organisasi_nama: "Org Only",
            slug: "only",
          }],
        }],
      },
      isLoading: false, isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.spyOn(data, "useSelectSchool").mockReturnValue({
      mutate, isPending: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<PilihSekolahPage />);
    expect(mutate).toHaveBeenCalledWith(
      { name: "Only" },
      expect.any(Object),
    );
  });
});
