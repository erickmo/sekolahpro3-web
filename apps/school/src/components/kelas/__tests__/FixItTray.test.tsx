import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FixItTray } from "../FixItTray";

afterEach(cleanup);

describe("FixItTray", () => {
  it("renders the title and the item count", () => {
    render(
      <FixItTray
        title="Tanpa Wali"
        tone="danger"
        items={[{ name: "A" }, { name: "B" }]}
        renderItem={(it) => <span>{it.name}</span>}
      />,
    );
    expect(screen.getByText("Tanpa Wali")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
  });

  it("shows an empty hint when there are no items", () => {
    render(
      <FixItTray
        title="Belum Berkelas"
        tone="warning"
        items={[]}
        renderItem={() => null}
        emptyHint="Semua siswa sudah berkelas"
      />,
    );
    expect(screen.getByText("Semua siswa sudah berkelas")).toBeTruthy();
  });
});
