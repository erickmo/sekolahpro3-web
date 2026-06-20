/**
 * Tests for makeMk — the school sidebar item factory (lib/sidebarNav).
 *
 * Feature: clicking the "Akademik" sidebar item must open the Tahun Ajaran hub
 * with the picker forced open (?pick=1) instead of the hub auto-redirecting into
 * the last-opened TA. The destination behaviour (pick=1 ⇒ picker, no redirect)
 * is covered by routes/__tests__/akademik.index.test.tsx; here we assert the
 * MENU-SIDE wiring: the produced Link actually carries the search query, bare
 * items do not, and active-state matching is unchanged by the extraction.
 *
 * Router is stubbed so items render without a RouterProvider; the Link mock
 * encodes `to` + `params` + `search` into the anchor for assertions.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    search,
    children,
    className,
  }: {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, unknown>;
    children: ReactNode;
    className?: string;
  }) => {
    const q = search ? `?${new URLSearchParams(search as Record<string, string>).toString()}` : "";
    return (
      <a
        data-to={to}
        data-params={JSON.stringify(params ?? {})}
        data-search={JSON.stringify(search ?? null)}
        href={`${to}${q}`}
        className={className}
      >
        {children}
      </a>
    );
  },
}));

import { makeMk } from "./sidebarNav";

afterEach(() => cleanup());

describe("makeMk — Akademik picker wiring", () => {
  it("forwards { pick: 1 } as the rendered Link query", () => {
    const mk = makeMk("sek-uji", "/sch/sek-uji");
    const item = mk("/akademik", "Akademik", null, undefined, { pick: 1 });

    render(<>{item.render({ className: "c", children: "Akademik" })}</>);

    const link = screen.getByRole("link", { name: "Akademik" });
    // Scoped target keeps the $sekolah placeholder (router fills params); the
    // pick flag rides along as the query so the hub skips its auto-redirect.
    expect(link.getAttribute("data-to")).toBe("/sch/$sekolah/akademik");
    expect(link.getAttribute("data-params")).toContain("sek-uji");
    expect(link.getAttribute("href")).toBe("/sch/$sekolah/akademik?pick=1");
  });

  it("renders a bare path (no query) when no search is given", () => {
    const mk = makeMk("sek-uji", "/sch/sek-uji");
    const item = mk("/siswa", "Siswa", null);

    render(<>{item.render({ className: "c", children: "Siswa" })}</>);

    const link = screen.getByRole("link", { name: "Siswa" });
    expect(link.getAttribute("href")).toBe("/sch/$sekolah/siswa");
    expect(link.getAttribute("data-search")).toBe("null");
  });
});

describe("makeMk — active-state matching (unchanged by extraction)", () => {
  it("highlights the parent item on a nested route", () => {
    const mk = makeMk("sek-uji", "/sch/sek-uji/akademik/2025/kelas");
    expect(mk("/akademik", "Akademik", null, undefined, { pick: 1 }).active).toBe(true);
  });

  it("matches Dashboard '/' exactly, never as a prefix", () => {
    const onSub = makeMk("sek-uji", "/sch/sek-uji/siswa");
    expect(onSub("/", "Dashboard", null).active).toBe(false);

    const onRoot = makeMk("sek-uji", "/sch/sek-uji");
    expect(onRoot("/", "Dashboard", null).active).toBe(true);
  });
});

describe("makeMk — no school selected", () => {
  it("links to /pilih and stays inactive when slug is undefined", () => {
    const mk = makeMk(undefined, "/login");
    const item = mk("/akademik", "Akademik", null, undefined, { pick: 1 });

    expect(item.active).toBe(false);
    render(<>{item.render({ className: "c", children: "Akademik" })}</>);
    expect(screen.getByRole("link", { name: "Akademik" }).getAttribute("href")).toBe("/pilih");
  });
});
