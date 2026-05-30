// vitest.config sets globals:false → import test API explicitly.
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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

const baseSchool = {
  sekolah: "S1", nama: "Sek 1", logo: null,
  role_sekolah: "Admin", jenis: "Negeri", tingkat: "SD",
  status: "Aktif", subdomain: "s1",
  organisasi: "O1", organisasi_nama: "Org 1", slug: "s1",
};

function mockSchools(footer: data.FooterContent | null) {
  vi.spyOn(data, "useMySchools").mockReturnValue({
    data: {
      total_schools: 1, org_count: 1,
      groups: [{ organisasi: "O1", organisasi_nama: "Org 1", schools: [baseSchool] }],
      onboarding: null,
      footer,
    },
    isLoading: false, isError: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  vi.spyOn(data, "useSelectSchool").mockReturnValue({
    mutate: vi.fn(), isPending: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

describe("PilihSekolahPage footer", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders footer text from SekolahPro Settings", () => {
    mockSchools({ text: "© 2099 Footer Kustom", url: null, url_label: null });
    wrap(<PilihSekolahPage />);
    expect(screen.getByText("© 2099 Footer Kustom")).toBeInTheDocument();
  });

  it("renders a footer link when url + label provided", () => {
    mockSchools({
      text: "© 2099 SekolahPro",
      url: "https://thunderlab.id",
      url_label: "Thunderlab",
    });
    wrap(<PilihSekolahPage />);
    const link = screen.getByRole("link", { name: "Thunderlab" });
    // safeHttpUrl normalises via URL(), which appends the root path.
    expect(link).toHaveAttribute("href", "https://thunderlab.id/");
  });

  it("falls back to default footer when footer is null", () => {
    mockSchools(null);
    wrap(<PilihSekolahPage />);
    expect(screen.getByText(/built by Thunderlab/)).toBeInTheDocument();
  });
});
