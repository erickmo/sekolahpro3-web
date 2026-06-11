/**
 * Tests untuk halaman Buat Pendaftaran PPDB (sch.$sekolah.ppdb.buat).
 *
 * Memverifikasi:
 *  - Halaman merender header + PageGuide (tutorial) + section form berurut.
 *  - Stepper langkah (Gelombang, Calon Siswa, ...) tampil sebagai panduan alur.
 *  - Mencoba lanjut dengan field wajib kosong memunculkan minimal satu pesan
 *    validasi inline (Bahasa Indonesia) — submit/mutation TIDAK dipanggil.
 *
 * Router + api-client + auth di-stub penuh agar test murni terhadap UI.
 */

// vitest.config sets globals:false → import test API explicitly.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Shared mocks dideklarasikan via vi.hoisted agar aman direferensikan di dalam
// factory vi.mock (yang di-hoist ke atas file).
const { navigateMock, createMutate, fetchMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  createMutate: vi.fn(),
  fetchMock: vi.fn(),
}));

// --- Router stub: page butuh createFileRoute, useParams, useNavigate, Link. ---
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useParams: () => ({ sekolah: "sekolah-test" }),
  useNavigate: () => navigateMock,
  Link: ({ children }: { children: ReactNode }) => <a href="#stub">{children}</a>,
}));

// --- Auth stub: peran apa pun (role hanya framing, tidak menggate UI). ---
vi.mock("@sekolahpro/auth", () => ({
  useSession: () => ({ roles: ["Kepala Sekolah"] }),
}));

// --- api-client stub: list kosong + mutation yang melacak pemanggilan. ---
vi.mock("@sekolahpro/api-client", () => ({
  useResourceList: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useResourceCreate: () => ({ mutateAsync: createMutate, isPending: false }),
  frappeFetch: fetchMock,
}));

// --- ppdbApi stub: gelombang aktif kosong + mutation hooks no-op. ---
// Factory inline (tanpa variabel top-level) karena vi.mock di-hoist ke atas.
vi.mock("../../lib/ppdbApi", () => {
  const noopMutation = () => ({ mutateAsync: vi.fn(), isPending: false });
  return {
    useGelombangAktif: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
    useAjukanPendaftaran: noopMutation,
    useVerifikasiPendaftaran: noopMutation,
    useSetHasilSeleksi: noopMutation,
    useCreatePaymentOrder: noopMutation,
  };
});

import { Route } from "../sch.$sekolah.akademik.ppdb.buat";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

function renderPage() {
  // Route adalah object dari createFileRoute stub: { component }.
  const Page = (Route as unknown as { component: () => ReactNode }).component;
  return wrap(<Page />);
}

describe("Halaman Buat Pendaftaran PPDB", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    createMutate.mockReset();
    fetchMock.mockReset();
  });
  afterEach(() => cleanup());

  it("merender header Buat Pendaftaran PPDB", () => {
    renderPage();
    expect(screen.getAllByText(/buat pendaftaran ppdb/i).length).toBeGreaterThan(0);
  });

  it("merender PageGuide tutorial alur", () => {
    renderPage();
    expect(screen.getByText(/cara pakai halaman ini/i)).toBeInTheDocument();
  });

  it("merender langkah-langkah form (Gelombang & Calon Siswa) sebagai panduan alur", () => {
    renderPage();
    expect(screen.getAllByText(/gelombang/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/calon siswa/i).length).toBeGreaterThan(0);
  });

  it("lanjut dengan field wajib kosong memunculkan pesan validasi inline", () => {
    renderPage();
    // Langkah pertama (Gelombang): tahun ajaran belum dipilih → tombol lanjut
    // memunculkan pesan validasi alih-alih berpindah langkah.
    const lanjut = screen.getByRole("button", { name: /lanjut/i });
    fireEvent.click(lanjut);
    // Pesan validasi spesifik langkah Gelombang (bukan tips PageGuide).
    expect(screen.getByText(/tahun ajaran wajib dipilih/i)).toBeInTheDocument();
    // Submit/mutation tidak boleh terpanggil saat validasi gagal.
    expect(createMutate).not.toHaveBeenCalled();
  });
});
