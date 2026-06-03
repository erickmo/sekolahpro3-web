/**
 * Tests for OrangContextBar — verifies the per-domain konteks label + focus copy,
 * the role badge (permissive fallback => Tata Usaha), and the optional CTA slot.
 * Router-free component, so it renders without a Router. Active vitest config is
 * globals:false, so imports are explicit and every render is torn down in afterEach.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { useSession } from "@sekolahpro/auth";
import { OrangContextBar } from "./OrangContextBar";

vi.mock("@sekolahpro/auth", () => ({ useSession: vi.fn() }));
const mockedUseSession = vi.mocked(useSession);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OrangContextBar", () => {
  it("renders the kesiswaan konteks for domain=siswa", () => {
    mockedUseSession.mockReturnValue({ roles: [] } as never);
    render(<OrangContextBar domain="siswa" />);
    expect(screen.getByText("Konteks Kesiswaan")).toBeTruthy();
    // Empty session => permissive fallback => default primary is Tata Usaha.
    expect(screen.getByText("Tata Usaha")).toBeTruthy();
    expect(screen.getByText(/penerimaan, mutasi, dan kelulusan siswa/i)).toBeTruthy();
  });

  it("renders the kepegawaian konteks for domain=staff", () => {
    mockedUseSession.mockReturnValue({ roles: [] } as never);
    render(<OrangContextBar domain="staff" />);
    expect(screen.getByText("Konteks Kepegawaian")).toBeTruthy();
    expect(screen.getByText(/penugasan mengajar, dan administrasi kepegawaian/i)).toBeTruthy();
  });

  it("reflects the session role in the badge", () => {
    mockedUseSession.mockReturnValue({ roles: ["kepala_sekolah"] } as never);
    render(<OrangContextBar domain="siswa" />);
    expect(screen.getByText("Pimpinan Sekolah")).toBeTruthy();
  });

  it("renders the optional CTA slot when provided", () => {
    mockedUseSession.mockReturnValue({ roles: [] } as never);
    render(<OrangContextBar domain="siswa" cta={<button>Tambah Siswa</button>} />);
    expect(screen.getByRole("button", { name: "Tambah Siswa" })).toBeTruthy();
  });
});
