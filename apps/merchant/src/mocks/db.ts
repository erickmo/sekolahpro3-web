export interface MockStudent {
  kartu_id: string;
  nama: string;
  saldo: number;
  daily_limit?: number;
  today_spent: number;
  blocked_kategori: string[];
  postpaid: boolean;
}
export interface MockItem {
  name: string;
  nama: string;
  harga: number;
  kategori_item: string;
  aktif: boolean;
  track_stok: boolean;
  stok_qty: number | null;
}
export interface MockTxn {
  name: string;
  kartu: string;
  nominal: number;
  items: { name: string; qty: number; price: number }[];
  merchant: string;
  terminal_id: string;
  tanggal: string;
  status: "Bayar" | "Void";
  void_deadline_iso: string;
}

export const db = {
  merchant: { name: "M-001", nama: "Kantin Sekolah A", tipe: "Internal" as const, kategori: "MAKAN" },
  students: [
    { kartu_id: "KARTU-001", nama: "Andi", saldo: 50000, today_spent: 0, blocked_kategori: [], postpaid: false } as MockStudent,
    { kartu_id: "KARTU-002", nama: "Budi", saldo: 5000, today_spent: 0, blocked_kategori: [], postpaid: false } as MockStudent,
    { kartu_id: "KARTU-003", nama: "Citra", saldo: 100000, daily_limit: 20000, today_spent: 18000, blocked_kategori: ["JAJAN"], postpaid: false } as MockStudent,
  ] as MockStudent[],
  items: [
    { name: "I-001", nama: "Nasi Ayam", harga: 15000, kategori_item: "MAKAN", aktif: true, track_stok: false, stok_qty: null },
    { name: "I-002", nama: "Es Teh", harga: 5000, kategori_item: "MINUM", aktif: true, track_stok: true, stok_qty: 3 },
    { name: "I-003", nama: "Snack", harga: 8000, kategori_item: "JAJAN", aktif: true, track_stok: false, stok_qty: null },
  ] as MockItem[],
  transaksi: [] as MockTxn[],
  idempotency: new Map<string, MockTxn>(),
};
