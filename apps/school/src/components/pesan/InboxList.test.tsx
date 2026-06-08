import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { InboxList } from "./InboxList";
import type { InboxRow } from "../../lib/pesan/inbox";

const rows: InboxRow[] = [
  { name: "1", nama: "Budi Santoso", email: "budi@x.id", pesan: "Tanya SPP", status: "Baru" },
  { name: "2", nama: "Ani Lestari", email: "ani@x.id", pesan: "Jadwal", status: "Dibalas" },
];

const noop = () => {};

describe("InboxList", () => {
  afterEach(() => cleanup());

  it("renders a row per message with its preview text", () => {
    render(
      <InboxList
        rows={rows}
        selectedName={null}
        search=""
        filter="Semua"
        loading={false}
        error={false}
        onSearch={noop}
        onFilter={noop}
        onSelect={noop}
      />,
    );
    expect(screen.getByText("Budi Santoso")).toBeTruthy();
    expect(screen.getByText("Ani Lestari")).toBeTruthy();
    // "Baru" would collide with the filter pill (getByText finds multiple) — assert the
    // unique message preview instead.
    expect(screen.getByText("Tanya SPP")).toBeTruthy();
  });

  it("shows the empty state when there are no rows", () => {
    render(
      <InboxList
        rows={[]}
        selectedName={null}
        search=""
        filter="Semua"
        loading={false}
        error={false}
        onSearch={noop}
        onFilter={noop}
        onSelect={noop}
      />,
    );
    expect(screen.getByText("Tidak ada pesan.")).toBeTruthy();
  });

  it("fires onSelect with the row name when a message is clicked", () => {
    const onSelect = vi.fn();
    render(
      <InboxList
        rows={rows}
        selectedName={null}
        search=""
        filter="Semua"
        loading={false}
        error={false}
        onSearch={noop}
        onFilter={noop}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText("Budi Santoso"));
    expect(onSelect).toHaveBeenCalledWith("1");
  });
});
