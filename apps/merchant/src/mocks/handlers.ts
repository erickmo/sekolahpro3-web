import { http, HttpResponse } from "msw";
import { db } from "./db";

const VOID_WINDOW_MIN = 10;

function isoNowPlus(min: number) {
  return new Date(Date.now() + min * 60_000).toISOString();
}

function decodeToken(raw: string): { kartu_id: string; exp: number } | null {
  try {
    const pad = raw.length % 4 === 0 ? "" : "=".repeat(4 - (raw.length % 4));
    const s = raw.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const obj = JSON.parse(atob(s));
    if (typeof obj.kartu_id !== "string" || typeof obj.exp !== "number") return null;
    return { kartu_id: obj.kartu_id, exp: obj.exp };
  } catch {
    return null;
  }
}

export const handlers = [
  http.get("/api/method/ping", () => HttpResponse.json({ ok: true })),

  // frappeFetch always POSTs to /api/method/<dotted>, so read endpoints
  // are registered as POST too (Frappe whitelisted methods accept POST).
  http.post("/api/method/sekolahpro.koperasi.merchant.catalog", () => {
    return HttpResponse.json({ message: db.items.filter((i) => i.aktif) });
  }),

  http.post("/api/method/sekolahpro.koperasi.merchant.charge", async ({ request }) => {
    const body = (await request.json()) as {
      terminal_id: string;
      card_token: string;
      items: { name: string; qty: number }[];
      amount: number;
      idempotency_key: string;
    };

    if (db.idempotency.has(body.idempotency_key)) {
      const txn = db.idempotency.get(body.idempotency_key)!;
      const stu = db.students.find((s) => s.kartu_id === txn.kartu);
      return HttpResponse.json({
        message: {
          txn_name: txn.name,
          nama_siswa: stu?.nama ?? "",
          balance_after: stu?.saldo ?? 0,
          void_deadline_iso: txn.void_deadline_iso,
          replayed: true,
        },
      });
    }

    const tok = decodeToken(body.card_token);
    if (!tok) return HttpResponse.json({ message: { error: "CARD_INVALID" } }, { status: 400 });
    if (tok.exp < Math.floor(Date.now() / 1000))
      return HttpResponse.json({ message: { error: "CARD_EXPIRED" } }, { status: 400 });

    const stu = db.students.find((s) => s.kartu_id === tok.kartu_id);
    if (!stu) return HttpResponse.json({ message: { error: "CARD_INVALID" } }, { status: 400 });

    if (stu.blocked_kategori.includes(db.merchant.kategori))
      return HttpResponse.json({ message: { error: "KATEGORI_BLOCKED" } }, { status: 400 });

    if (stu.daily_limit !== undefined && stu.today_spent + body.amount > stu.daily_limit)
      return HttpResponse.json({ message: { error: "DAILY_LIMIT_EXCEEDED" } }, { status: 400 });

    if (stu.saldo < body.amount && !stu.postpaid)
      return HttpResponse.json({ message: { error: "INSUFFICIENT_FUNDS" } }, { status: 400 });

    stu.saldo = Math.max(0, stu.saldo - body.amount);
    stu.today_spent += body.amount;

    const txn = {
      name: `EMT-${Date.now()}`,
      kartu: stu.kartu_id,
      nominal: body.amount,
      items: body.items.map((it) => ({
        name: it.name,
        qty: it.qty,
        price: db.items.find((i) => i.name === it.name)?.harga ?? 0,
      })),
      merchant: db.merchant.name,
      terminal_id: body.terminal_id,
      tanggal: new Date().toISOString(),
      status: "Bayar" as const,
      void_deadline_iso: isoNowPlus(VOID_WINDOW_MIN),
    };
    db.transaksi.unshift(txn);
    db.idempotency.set(body.idempotency_key, txn);

    return HttpResponse.json({
      message: {
        txn_name: txn.name,
        nama_siswa: stu.nama,
        balance_after: stu.saldo,
        void_deadline_iso: txn.void_deadline_iso,
      },
    });
  }),

  http.post("/api/method/sekolahpro.koperasi.merchant.void", async ({ request }) => {
    const { txn_name } = (await request.json()) as { txn_name: string };
    const txn = db.transaksi.find((t) => t.name === txn_name);
    if (!txn) return HttpResponse.json({ message: { error: "NOT_FOUND" } }, { status: 404 });
    if (new Date(txn.void_deadline_iso).getTime() < Date.now())
      return HttpResponse.json({ message: { error: "VOID_WINDOW_EXPIRED" } }, { status: 400 });
    txn.status = "Void";
    const stu = db.students.find((s) => s.kartu_id === txn.kartu);
    if (stu) {
      stu.saldo += txn.nominal;
      stu.today_spent = Math.max(0, stu.today_spent - txn.nominal);
    }
    return HttpResponse.json({ message: { ok: true } });
  }),

  http.post("/api/method/sekolahpro.koperasi.merchant.transaksi", () => {
    const withNames = db.transaksi.map((t) => ({
      ...t,
      nama_siswa: db.students.find((s) => s.kartu_id === t.kartu)?.nama,
    }));
    return HttpResponse.json({ message: withNames });
  }),

  http.post("/api/method/sekolahpro.koperasi.merchant.daily_report", () => {
    const today = db.transaksi.filter((t) => t.status === "Bayar");
    return HttpResponse.json({
      message: {
        total_transaksi: today.length,
        total_nominal: today.reduce((a, t) => a + t.nominal, 0),
        by_item: db.items.map((i) => ({
          name: i.name,
          nama: i.nama,
          qty: today
            .flatMap((t) => t.items)
            .filter((it) => it.name === i.name)
            .reduce((a, it) => a + it.qty, 0),
        })),
      },
    });
  }),
];
