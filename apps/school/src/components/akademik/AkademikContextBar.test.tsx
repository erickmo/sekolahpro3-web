import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { AkademikContextProvider, type AkademikContextValue } from "../../lib/akademikContext";
import { AkademikContextBar, resolvePeriodeStatus, STATUS_LABEL } from "./AkademikContextBar";

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
    expect(screen.getByText(/mengedit periode lampau/i)).toBeTruthy();
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

  it("menampilkan badge status periode 'berjalan' untuk periode aktif", () => {
    renderBar();
    expect(screen.getByText(STATUS_LABEL.aktif)).toBeTruthy();
  });

  it("menampilkan badge status 'lampau' saat periode lampau", () => {
    renderBar({ isPastPeriod: true });
    expect(screen.getByText(STATUS_LABEL.lampau)).toBeTruthy();
  });

  it("menampilkan label peran (fallback permisif tanpa SessionProvider)", () => {
    renderBar();
    // useAkademikRole falls back to admin when no session is mounted.
    expect(screen.getByText("Administrator Akademik")).toBeTruthy();
  });
});

describe("resolvePeriodeStatus", () => {
  it("mengembalikan belum-aktif saat tak ada TA aktif (prioritas tertinggi)", () => {
    expect(resolvePeriodeStatus(true, false)).toBe("belum-aktif");
    expect(resolvePeriodeStatus(true, true)).toBe("belum-aktif");
  });

  it("mengembalikan lampau saat periode lewat dan TA aktif ada", () => {
    expect(resolvePeriodeStatus(false, true)).toBe("lampau");
  });

  it("mengembalikan aktif saat periode berjalan", () => {
    expect(resolvePeriodeStatus(false, false)).toBe("aktif");
  });
});
