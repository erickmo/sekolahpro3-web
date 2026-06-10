import { describe, it, expect } from "vitest";
import {
  OUTBOX_OP,
  PESAN_WALI_KATEGORI,
  PESAN_WALI_CHANNEL,
  buildReplyPayload,
  buildBroadcastPayload,
  buildPesanWaliPayload,
  buildPesanWaliDoc,
  canSendPesanWali,
  pesanWaliChannel,
  pesanWaliSentLabel,
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

describe("buildPesanWaliDoc — roster-inline composer doc payload", () => {
  it("builds the authoring fields only (controller fills guru/thread/phone/status)", () => {
    const doc = buildPesanWaliDoc({
      siswa: "SIS-7",
      rombel: "ROM-1A",
      kategori: "Kehadiran",
      isi: "  Ananda alpa 3 hari  ",
      channel: PESAN_WALI_CHANNEL.WA,
    });
    expect(doc).toEqual({
      siswa: "SIS-7",
      rombel: "ROM-1A",
      kategori: "Kehadiran",
      isi: "Ananda alpa 3 hari",
      arah: "keluar",
      channel: "WA",
    });
  });

  it("mirrors the doctype kategori Select options", () => {
    expect(PESAN_WALI_KATEGORI).toEqual(["Kehadiran", "Akademik", "PR", "Umum"]);
  });
});

describe("canSendPesanWali", () => {
  it("rejects a blank or whitespace-only message", () => {
    expect(canSendPesanWali("SIS-7", "")).toBe(false);
    expect(canSendPesanWali("SIS-7", "   ")).toBe(false);
  });

  it("rejects a missing siswa and accepts a real draft", () => {
    expect(canSendPesanWali("", "halo")).toBe(false);
    expect(canSendPesanWali("SIS-7", "halo")).toBe(true);
  });
});

describe("pesanWaliChannel — WA needs a wali phone", () => {
  it("picks WA when a phone exists, InApp otherwise", () => {
    expect(pesanWaliChannel("08123")).toBe(PESAN_WALI_CHANNEL.WA);
    expect(pesanWaliChannel("")).toBe(PESAN_WALI_CHANNEL.IN_APP);
    expect(pesanWaliChannel(null)).toBe(PESAN_WALI_CHANNEL.IN_APP);
    expect(pesanWaliChannel(undefined)).toBe(PESAN_WALI_CHANNEL.IN_APP);
  });
});

describe("pesanWaliSentLabel — honest post-insert wording", () => {
  it("labels WA as a queued hand-off, never 'Terkirim'", () => {
    expect(pesanWaliSentLabel(PESAN_WALI_CHANNEL.WA)).toBe(queuedLabel("WA"));
    expect(pesanWaliSentLabel(PESAN_WALI_CHANNEL.WA)).not.toContain("Terkirim");
  });

  it("labels InApp as recorded in the parent app (the insert IS the delivery)", () => {
    expect(pesanWaliSentLabel(PESAN_WALI_CHANNEL.IN_APP)).toMatch(/aplikasi/i);
    expect(pesanWaliSentLabel(PESAN_WALI_CHANNEL.IN_APP)).not.toContain("Terkirim");
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
