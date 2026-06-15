// vitest.config sets globals:false → import test API explicitly.
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  buildMemberViewModel,
  mapTransaksiRows,
  resolvePersonName,
  type BuildMemberInput,
} from "../../lib/koperasi/memberDetail";
import { AnggotaDetailView } from "../kop.$sekolah.$noAnggota";
import type { MemberActions } from "../../components/koperasi-anggota/MemberTabs";

vi.mock("@tanstack/react-router", () => ({
  useParams: () => ({ sekolah: "kop-demo" }),
  createFileRoute: () => (opts: unknown) => opts,
  Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
  notFound: () => new Error("notFound"),
}));

function baseInput(over: Partial<BuildMemberInput> = {}): BuildMemberInput {
  return {
    doc: {
      name: "AGT-0007",
      nomor_anggota: "AGT-0007",
      nasabah: "NSB-0007",
      jenis_anggota: "Anggota",
      tanggal_masuk: "2024-01-10",
      status: "Aktif",
      simpanan_pokok_wajib: [
        { jenis_simpanan: "Pokok", jumlah: 100000, status_bayar: "Lunas" },
        { jenis_simpanan: "Wajib", jumlah: 50000, status_bayar: "Lunas" },
        { jenis_simpanan: "Wajib", jumlah: 50000, status_bayar: "Belum" },
      ],
    },
    nasabah: { name: "NSB-0007", pihak_tipe: "Siswa", pihak: "S-007", status: "Aktif" },
    personName: "Budi Santoso",
    rekening: [
      { name: "REK-1", produk_simpanan: "PRD-SUK", status: "Aktif", saldo: 200000 },
      { name: "REK-2", produk_simpanan: "PRD-DEP", status: "Aktif", saldo: 500000 },
    ],
    produk: [
      { name: "PRD-SUK", jenis: "Sukarela" },
      { name: "PRD-DEP", jenis: "Deposito" },
    ],
    transaksi: [
      { name: "TRX-1", jenis: "Setoran", jumlah: 100000, tanggal: "2026-06-01", approval_status: "Otomatis" },
      { name: "TRX-2", jenis: "Penarikan", jumlah: 50000, tanggal: "2026-06-02", approval_status: "Disetujui" },
    ],
    akad: [
      { name: "AKD-1", nomor_akad: "AKD-1", jumlah_pokok: 1000000, margin_total: 120000, tenor: 12, status: "Aktif" },
    ],
    shuItems: [{ name: "SHU-1", jasa_anggota: 30000, jasa_modal: 5000, total_shu: 35000 }],
    ...over,
  };
}

describe("buildMemberViewModel", () => {
  it("derives saldo per jenis from the Anggota child + rekening (paid Wajib only)", () => {
    const vm = buildMemberViewModel(baseInput());
    expect(vm.saldo.pokok).toBe(100000);
    expect(vm.saldo.wajib).toBe(50000); // the "Belum" row is excluded
    expect(vm.saldo.sukarela).toBe(200000);
    expect(vm.saldo.berjangka).toBe(500000); // Deposito grouped under Berjangka
    expect(vm.saldo.total).toBe(850000);
  });

  it("maps akad to a live Pinjaman row and totals active outstanding", () => {
    const vm = buildMemberViewModel(baseInput());
    expect(vm.pinjaman).toHaveLength(1);
    expect(vm.pinjaman[0]!.status).toBe("Berjalan");
    expect(vm.pinjaman[0]!.jumlah).toBe(1000000);
    expect(vm.pinjaman[0]!.bunga).toBe(12); // 120000 / 1000000 * 100
    expect(vm.pinjamanAktif).toBe(1000000);
  });

  it("maps SHU + transaksi direction and uses the resolved person name", () => {
    const vm = buildMemberViewModel(baseInput());
    expect(vm.nama).toBe("Budi Santoso");
    expect(vm.shu[0]!.totalShu).toBe(35000);
    expect(vm.simpanan.map((s) => s.tipe)).toEqual(["Setor", "Tarik"]);
  });

  it("falls back name to pihak then nomor_anggota, never fabricates", () => {
    const noPerson = buildMemberViewModel(baseInput({ personName: undefined }));
    expect(noPerson.nama).toBe("S-007"); // nasabah.pihak
    const noNasabah = buildMemberViewModel(
      baseInput({ personName: undefined, nasabah: undefined }),
    );
    expect(noNasabah.nama).toBe("AGT-0007"); // nomor_anggota
  });
});

describe("mapper helpers", () => {
  it("resolvePersonName probes known name fields", () => {
    expect(resolvePersonName({ nama_lengkap: "Ani" })).toBe("Ani");
    expect(resolvePersonName({ full_name: "Budi" })).toBe("Budi");
    expect(resolvePersonName({})).toBeUndefined();
    expect(resolvePersonName(undefined)).toBeUndefined();
  });

  it("classifies transaksi debit vs credit by jenis", () => {
    const rows = mapTransaksiRows([
      { name: "a", jenis: "Bagi Hasil", jumlah: 1 },
      { name: "b", jenis: "Biaya Admin Dormant", jumlah: 2 },
    ]);
    expect(rows[0]!.tipe).toBe("Setor");
    expect(rows[1]!.tipe).toBe("Tarik");
  });
});

describe("AnggotaDetailView", () => {
  afterEach(() => cleanup());

  const actions: MemberActions = {
    hasActiveRekening: true,
    onSetor: vi.fn(),
    onTarik: vi.fn(),
    onPinjaman: vi.fn(),
    onAngsuran: vi.fn(),
    onEdit: vi.fn(),
  };

  it("renders a real member (no 404) with live identity", () => {
    const vm = buildMemberViewModel(baseInput());
    render(
      <AnggotaDetailView
        vm={vm}
        sekolah="kop-demo"
        tab="ringkasan"
        onTab={vi.fn()}
        onBack={vi.fn()}
        actions={actions}
      />,
    );
    expect(screen.getAllByText("Budi Santoso").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AGT-0007/).length).toBeGreaterThan(0);
  });
});
