/**
 * Tests for the PageGuide guide card.
 *
 * Covers two regression bugs (giant icon, non-collapsible) plus the
 * module-agnostic role-label API (roleLabel fn + roleLabels map fallback).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PageGuide } from "./PageGuide";

const STEP_TEXT = "Langkah satu";

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

// Unmount the previous render so screen queries don't see stale DOM from the
// earlier test (otherwise getByText finds the step twice).
afterEach(() => cleanup());

describe("PageGuide", () => {
  it("renders a sized IconBook on the toggle button (catches giant-icon bug)", () => {
    render(
      <PageGuide storageId="test-guide-icon" steps={[{ title: STEP_TEXT }]} tips={["tip"]} />,
    );

    const toggle = screen.getByRole("button");
    const icon = toggle.querySelector("svg");
    expect(icon).not.toBeNull();

    // The icon must carry a Tailwind size token (e.g. h-4 / w-4). Without a
    // size class the icon renders at its intrinsic (giant) size.
    const className = icon?.getAttribute("class") ?? "";
    expect(className).toMatch(/\b[hw]-\d/);
  });

  it("collapses and expands the steps when the toggle is clicked", () => {
    render(
      <PageGuide storageId="test-guide-collapse" steps={[{ title: STEP_TEXT }]} tips={["tip"]} />,
    );

    // Open by default: the step text is visible.
    expect(screen.getByText(STEP_TEXT)).toBeInTheDocument();

    const toggle = screen.getByRole("button");

    // First click collapses: the step text disappears.
    fireEvent.click(toggle);
    expect(screen.queryByText(STEP_TEXT)).toBeNull();

    // Second click expands: the step text comes back.
    fireEvent.click(toggle);
    expect(screen.getByText(STEP_TEXT)).toBeInTheDocument();
  });
});

describe("PageGuide role labels", () => {
  it("renders a custom role label via the roleLabel prop (reusable across modules)", () => {
    render(
      <PageGuide
        storageId="keuangan-test-1"
        steps={[{ title: "Terima pembayaran", roles: ["kasir"] }]}
        roleLabel={(r) => (r === "kasir" ? "Kasir / Tata Usaha" : r)}
      />,
    );
    expect(screen.getByText("Kasir / Tata Usaha")).toBeTruthy();
  });

  it("supports the roleLabels map form", () => {
    render(
      <PageGuide
        storageId="orang-test-1"
        steps={[{ title: "Kelola siswa", roles: ["wali"] }]}
        roleLabels={{ wali: "Wali Kelas" }}
      />,
    );
    expect(screen.getByText("Wali Kelas")).toBeTruthy();
  });

  it("defaults to the akademik labels for backward compatibility", () => {
    render(
      <PageGuide storageId="akademik-test-1" steps={[{ title: "Input nilai", roles: ["guru"] }]} />,
    );
    expect(screen.getByText("Guru")).toBeTruthy();
  });

  it("renders the step title and intro", () => {
    render(
      <PageGuide storageId="keuangan-test-2" intro="Panduan keuangan" steps={[{ title: "Buat tagihan" }]} />,
    );
    expect(screen.getByText("Panduan keuangan")).toBeTruthy();
    expect(screen.getByText("Buat tagihan")).toBeTruthy();
  });
});
