import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Mock the two heavy surfaces to sentinels so we test ONLY the role switch.
vi.mock("../PapanKelas", () => ({ PapanKelas: () => <div>SURFACE_PAPAN</div> }));
vi.mock("../MejaPersetujuanKelas", () => ({
  MejaPersetujuanKelas: () => <div>SURFACE_MEJA</div>,
}));

// Mock the router primitives the route module touches at import + render time.
// The index now lives under the per-TA workspace, so useParams exposes `ta` too.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useParams: () => ({ sekolah: "s1", ta: "2024-2025" }),
  Navigate: ({ to }: { to: string }) => <div>REDIRECT:{to}</div>,
}));

// Controllable role hook.
const useKelasRole = vi.fn();
vi.mock("../../../lib/kelasRole", () => ({ useKelasRole: () => useKelasRole() }));

import { Route } from "../../../routes/sch.$sekolah.akademik.$ta.kelas.index";

const Surface = (Route as unknown as { component: () => JSX.Element }).component;

afterEach(() => {
  cleanup();
  useKelasRole.mockReset();
});

describe("kelas index — role switch", () => {
  it("renders Papan Kelas for the TU (default) role", () => {
    useKelasRole.mockReturnValue({ primary: "tu", roles: ["tu"] });
    render(<Surface />);
    expect(screen.getByText("SURFACE_PAPAN")).toBeTruthy();
    expect(screen.queryByText("SURFACE_MEJA")).toBeNull();
  });

  it("renders the Meja Persetujuan for the Kepsek role", () => {
    useKelasRole.mockReturnValue({ primary: "kepsek", roles: ["kepsek"] });
    render(<Surface />);
    expect(screen.getByText("SURFACE_MEJA")).toBeTruthy();
    expect(screen.queryByText("SURFACE_PAPAN")).toBeNull();
  });

  it("redirects a Wali Kelas to the /saya cockpit", () => {
    useKelasRole.mockReturnValue({ primary: "wali_kelas", roles: ["wali_kelas"] });
    render(<Surface />);
    expect(screen.getByText("REDIRECT:/sch/$sekolah/akademik/$ta/kelas/saya")).toBeTruthy();
  });
});
