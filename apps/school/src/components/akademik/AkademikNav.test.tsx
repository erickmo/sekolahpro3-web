import { describe, it, expect, afterEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import {
  createRootRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { AkademikNav } from "./AkademikNav";

afterEach(cleanup);

// AkademikNav renders <Link>, so it needs a router context to mount.
function renderInRouter(node: ReactNode) {
  const rootRoute = createRootRoute({ component: () => <>{node}</> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/x"] }),
  });
  return render(<RouterProvider router={router as never} />);
}

describe("AkademikNav", () => {
  it("renders every module entry (same menu everywhere)", async () => {
    renderInRouter(
      <AkademikNav sekolah="sd-x" ta="2025/2026" pathname="/sch/sd-x/akademik/2025/kelas/daftar" />,
    );
    await screen.findByText("Dashboard");
    for (const label of ["Penilaian", "Kelas", "Jadwal", "Ekskul", "Absensi", "Pendaftaran", "PPDB"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("highlights the active module via brand styling", async () => {
    renderInRouter(
      <AkademikNav sekolah="sd-x" ta="2025/2026" pathname="/sch/sd-x/akademik/2025/kelas/rombel" />,
    );
    const kelas = await screen.findByRole("button", { name: "Kelas" });
    expect(kelas.className).toContain("bg-brand");
  });
});
