// Each situs content route is a thin wrapper that renders KontenManager with one
// schema. This pins that every route wires the CORRECT schema (right singular +
// add button), so a copy-paste mixup (e.g. Galeri rendering the Berita schema)
// fails fast.
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  useParams: () => ({ sekolah: "smp-demo" }),
}));
vi.mock("@sekolahpro/api-client", async () => {
  const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
  return { ...actual, frappeFetch: vi.fn(async () => []) };
});

import { BeritaPage } from "../sch.$sekolah.situs.berita";
import { HalamanPage } from "../sch.$sekolah.situs.halaman";
import { AgendaPage } from "../sch.$sekolah.situs.agenda";
import { GaleriPage } from "../sch.$sekolah.situs.galeri";
import { PrestasiPage } from "../sch.$sekolah.situs.prestasi";

afterEach(() => cleanup());

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

const cases = [
  { name: "Berita", Page: BeritaPage, singular: "Berita" },
  { name: "Halaman", Page: HalamanPage, singular: "Halaman" },
  { name: "Agenda", Page: AgendaPage, singular: "Agenda" },
  { name: "Galeri", Page: GaleriPage, singular: "Foto" },
  { name: "Prestasi", Page: PrestasiPage, singular: "Prestasi" },
];

describe("situs content routes", () => {
  it.each(cases)("$name route renders its KontenManager with the right schema", ({ Page, singular }) => {
    render(wrap(<Page sekolah="smp-demo" />));
    expect(screen.getByRole("button", { name: new RegExp(`Tambah ${singular}`) })).toBeInTheDocument();
  });
});
