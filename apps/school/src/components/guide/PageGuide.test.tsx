import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PageGuide } from "./PageGuide";

afterEach(() => {
  cleanup();
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
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
