/**
 * Render smoke test for MapelRelatedTabs.
 *
 * Covers AKA-26: the related-data tabs render and switch without crashing.
 * Deep per-tab data rendering is covered by the doctype list views; here we
 * assert the tab scaffold + switching behaviour.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MapelRelatedTabs } from "./MapelRelatedTabs";

vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
}));

afterEach(() => cleanup());

describe("MapelRelatedTabs", () => {
  it("renders all four related-data tabs", () => {
    render(<MapelRelatedTabs mapelName="MTK" />);
    expect(screen.getByText("KKM")).toBeTruthy();
    expect(screen.getByText("Komponen Nilai")).toBeTruthy();
    expect(screen.getByText("Konfigurasi Penilaian")).toBeTruthy();
    expect(screen.getByText("Entri Nilai")).toBeTruthy();
  });

  it("switches the active tab on click without crashing", () => {
    render(<MapelRelatedTabs mapelName="MTK" />);
    // Default tab is KKM; switching to another tab should not throw.
    fireEvent.click(screen.getByText("Entri Nilai"));
    expect(screen.getByText("Entri Nilai")).toBeTruthy();
  });
});
