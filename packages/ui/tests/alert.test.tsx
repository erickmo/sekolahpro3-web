import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Alert } from "../src/primitives/alert";

describe("Alert", () => {
  it("renders children with role=alert by default", () => {
    render(<Alert>Sesuatu salah</Alert>);
    const el = screen.getByRole("alert");
    expect(el).toHaveTextContent("Sesuatu salah");
  });

  it("applies danger tone styles", () => {
    render(<Alert tone="danger">Gagal memuat</Alert>);
    expect(screen.getByRole("alert").className).toMatch(/bg-danger/);
  });

  it("renders title when provided", () => {
    render(<Alert title="Perhatian" tone="warning">Sesi belum dibuka</Alert>);
    expect(screen.getByText("Perhatian")).toBeInTheDocument();
    expect(screen.getByText("Sesi belum dibuka")).toBeInTheDocument();
  });

  it("renders dismiss button and calls onDismiss", () => {
    let dismissed = false;
    render(
      <Alert tone="info" onDismiss={() => { dismissed = true; }}>
        Sukses
      </Alert>,
    );
    fireEvent.click(screen.getByRole("button", { name: /tutup/i }));
    expect(dismissed).toBe(true);
  });

  it("uses role=status for non-danger tones when statusRole=true", () => {
    render(<Alert tone="success" statusRole>Tersimpan</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Tersimpan");
  });
});
