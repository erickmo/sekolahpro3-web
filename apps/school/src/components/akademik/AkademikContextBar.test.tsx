import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { AkademikContextProvider, type AkademikContextValue } from "../../lib/akademikContext";
import { AkademikContextBar } from "./AkademikContextBar";

vi.mock("@sekolahpro/api-client", () => ({
  listResource: vi.fn().mockResolvedValue([]),
}));

const base: AkademikContextValue = {
  tahunAjaran: "S-2025", semester: "Genap",
  setTahunAjaran: vi.fn(), setSemester: vi.fn(),
  isPastPeriod: false, noActiveTa: false, dirty: false, setDirty: vi.fn(),
};

function renderBar(over: Partial<AkademikContextValue> = {}) {
  return render(
    <AkademikContextProvider value={{ ...base, ...over }}>
      <AkademikContextBar />
    </AkademikContextProvider>,
  );
}

describe("AkademikContextBar", () => {
  afterEach(() => cleanup());

  it("banner muncul saat periode lampau/ditutup", () => {
    renderBar({ isPastPeriod: true });
    expect(screen.getByText(/periode lampau/i)).toBeTruthy();
  });

  it("nudge muncul saat tak ada TA aktif", () => {
    renderBar({ noActiveTa: true });
    expect(screen.getByText(/Belum ada Tahun Ajaran aktif/i)).toBeTruthy();
  });

  it("tanpa flag, tak ada banner/nudge", () => {
    renderBar();
    expect(screen.queryByText(/periode lampau/i)).toBeNull();
    expect(screen.queryByText(/Belum ada Tahun Ajaran aktif/i)).toBeNull();
  });

  it("ganti semester saat dirty → konfirmasi dulu", () => {
    const setSemester = vi.fn();
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);
    renderBar({ dirty: true, setSemester });
    fireEvent.focus(screen.getByLabelText("Semester", { exact: false }));
    const opt = screen.getAllByRole("option").find((o) => o.textContent === "Ganjil");
    if (opt) fireEvent.mouseDown(opt);
    expect(confirmSpy).toHaveBeenCalled();
    expect(setSemester).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
