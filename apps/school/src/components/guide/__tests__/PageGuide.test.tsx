import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PageGuide } from "../PageGuide";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("PageGuide role labels", () => {
  it("renders a step's custom role label from the roleLabels prop", () => {
    render(
      <PageGuide
        storageId="t-custom"
        steps={[{ title: "Scan kartu", roles: ["petugas"] }]}
        roleLabels={{ petugas: "Petugas Sirkulasi" }}
      />,
    );
    expect(screen.getByText("Petugas Sirkulasi")).toBeTruthy();
  });

  it("falls back to the academic label when no roleLabels are given (backward compat)", () => {
    render(
      <PageGuide storageId="t-akademik" steps={[{ title: "Input nilai", roles: ["guru"] }]} />,
    );
    expect(screen.getByText("Guru")).toBeTruthy();
  });

  it("renders the raw role string when no label is known", () => {
    render(
      <PageGuide storageId="t-raw" steps={[{ title: "Langkah", roles: ["mystery"] }]} />,
    );
    expect(screen.getByText("mystery")).toBeTruthy();
  });

  it("shows intro and tips", () => {
    render(
      <PageGuide
        storageId="t-content"
        intro="Panduan singkat"
        steps={[{ title: "Satu" }]}
        tips={["Tip pertama"]}
      />,
    );
    expect(screen.getByText("Panduan singkat")).toBeTruthy();
    expect(screen.getByText("Tip pertama")).toBeTruthy();
  });
});
