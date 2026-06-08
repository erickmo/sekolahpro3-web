import { describe, it, expect } from "vitest";
import {
  OUTBOX_OP,
  buildReplyPayload,
  buildBroadcastPayload,
  buildPesanWaliPayload,
  queuedLabel,
} from "./compose";

const KEY = "outbox-test-123";

describe("buildReplyPayload", () => {
  it("builds the existing reply_contact_inbox outbox row shape", () => {
    const p = buildReplyPayload({ inbox: "INB-1", to: "wali@x.id", body: "halo", idempotencyKey: KEY });
    expect(p.op).toBe(OUTBOX_OP.REPLY);
    expect(p.idempotency_key).toBe(KEY);
    expect(p.status).toBe("received");
    expect(p.request_hash).toBe("n/a");
    expect(JSON.parse(p.response)).toEqual({ to: "wali@x.id", inbox: "INB-1", body: "halo" });
  });
});

describe("buildBroadcastPayload", () => {
  it("uses op send_broadcast and links back to the broadcast by name", () => {
    const p = buildBroadcastPayload({ broadcast: "BRD-9", to: "08123", body: "libur", idempotencyKey: KEY });
    expect(p.op).toBe(OUTBOX_OP.BROADCAST);
    expect(JSON.parse(p.response)).toEqual({ to: "08123", broadcast: "BRD-9", body: "libur" });
  });
});

describe("buildPesanWaliPayload", () => {
  it("uses op send_pesan_wali and carries siswa + pesan_wali link", () => {
    const p = buildPesanWaliPayload({
      pesanWali: "PW-3",
      siswa: "SIS-7",
      to: "08987",
      body: "Ananda alpa 3 hari",
      idempotencyKey: KEY,
    });
    expect(p.op).toBe(OUTBOX_OP.PESAN_WALI);
    expect(JSON.parse(p.response)).toEqual({
      to: "08987",
      siswa: "SIS-7",
      body: "Ananda alpa 3 hari",
      pesan_wali: "PW-3",
    });
  });
});

describe("queuedLabel — honest delivery vocabulary", () => {
  it("never claims 'Terkirim' for an unconfirmed queue write", () => {
    expect(queuedLabel("WA")).not.toContain("Terkirim");
    expect(queuedLabel("Email")).not.toContain("Terkirim");
  });

  it("qualifies WhatsApp as a hand-off, others as queued", () => {
    expect(queuedLabel("WA")).toMatch(/WhatsApp/i);
    expect(queuedLabel("WA")).toMatch(/Antre/i);
    expect(queuedLabel("Email")).toMatch(/Antre/i);
  });
});
