/**
 * Thin client wrappers for the Manajemen Aset whitelisted endpoints.
 *
 * Mirrors the ppdbApi pattern: each backend `@frappe.whitelist()` action gets a
 * React-Query mutation hook via {@link useFrappeMutation}. Components call these
 * instead of patching fields directly, because the actions run server-side
 * business logic (stock reserve/release, asset locking) that a REST field patch
 * cannot express.
 */
import { useFrappeMutation } from "@sekolahpro/api-client";

const BASE = "sekolahpro.manajemen_aset.api";

// Peminjaman lifecycle.
const M_SETUJUI = `${BASE}.peminjaman.setujui`;
const M_TOLAK = `${BASE}.peminjaman.tolak`;
const M_KEMBALIKAN = `${BASE}.peminjaman.kembalikan`;

// Maintenance lifecycle.
const M_JADWALKAN = `${BASE}.maintenance.jadwalkan`;
const M_MULAI = `${BASE}.maintenance.mulai`;
const M_SELESAI = `${BASE}.maintenance.selesai`;
const M_BATALKAN = `${BASE}.maintenance.batalkan`;

// Transfer lifecycle.
const M_SELESAIKAN_TRANSFER = `${BASE}.transfer.selesaikan`;

/** Approve a borrow request → status Dipinjam, reserves stock. */
export const useSetujuiPeminjaman = () =>
  useFrappeMutation<{ name: string }>(M_SETUJUI);

/** Reject a borrow request with a reason. */
export const useTolakPeminjaman = () =>
  useFrappeMutation<{ name: string; alasan: string }>(M_TOLAK);

/** Record return of borrowed assets → releases stock. */
export const useKembalikanPeminjaman = () =>
  useFrappeMutation<{ name: string }>(M_KEMBALIKAN);

/** Schedule a maintenance ticket. */
export const useJadwalkanMaintenance = () =>
  useFrappeMutation<{ name: string; tanggal_jadwal?: string; teknisi?: string }>(M_JADWALKAN);

/** Start work on a maintenance ticket → asset locked to Maintenance. */
export const useMulaiMaintenance = () =>
  useFrappeMutation<{ name: string }>(M_MULAI);

/** Complete a maintenance ticket → asset released, optional condition update. */
export const useSelesaiMaintenance = () =>
  useFrappeMutation<{ name: string; biaya?: number; tindakan?: string; kondisi_baru?: string }>(M_SELESAI);

/** Cancel a maintenance ticket. */
export const useBatalkanMaintenance = () =>
  useFrappeMutation<{ name: string; alasan?: string }>(M_BATALKAN);

/** Finalize an asset transfer → moves the asset's master location. */
export const useSelesaikanTransfer = () =>
  useFrappeMutation<{ name: string }>(M_SELESAIKAN_TRANSFER);
