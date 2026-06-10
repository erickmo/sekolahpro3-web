/**
 * Single source for the "Mobile Outbox Entry" dispatch contract used by every Pesan
 * surface. Today the op/idempotency_key/response-JSON shape is inlined in the route
 * (sch.$sekolah.pesan.tsx); centralizing it here means the backend gateway has ONE
 * place defining every op value it must recognize, and components never hand-roll the
 * envelope.
 *
 * Builders are PURE (the caller supplies `idempotencyKey`) so they unit-test without a
 * clock. `newIdempotencyKey` is the impure convenience used by components.
 *
 * Honest-delivery rule: a write into the append-only Mobile Outbox is a QUEUE write, not
 * a delivery receipt — whether a WA/Email gateway actually consumes it is unconfirmed
 * (see tournament open question). So broadcast/wali sends must label their result with
 * {@link queuedLabel} ("Antre …"), never "Terkirim". "Terkirim" is reserved for a
 * gateway/Email-Queue-confirmed status the FE does not yet have.
 */

/** Outbox `op` values the backend gateway dispatches on. */
export const OUTBOX_OP = {
  /** Reply to an inbound public-contact message (the existing, real flow). */
  REPLY: "reply_contact_inbox",
  /** One recipient row of a TU/Kepsek broadcast campaign. */
  BROADCAST: "send_broadcast",
  /** A teacher → single parent "Pesan Wali" message. */
  PESAN_WALI: "send_pesan_wali",
} as const;

export type OutboxOp = (typeof OUTBOX_OP)[keyof typeof OUTBOX_OP];

/**
 * The Mobile Outbox Entry row shape inserted for any outbound dispatch.
 * A `type` (not `interface`) so it stays assignable to the `Record<string, unknown>`
 * payload that useResourceCreate.mutateAsync expects.
 */
export type OutboxPayload = {
  idempotency_key: string;
  op: OutboxOp;
  request_hash: string;
  status: string;
  /** JSON-encoded channel envelope ({to, …}), parsed by the gateway worker. */
  response: string;
};

/** Outbox rows are created as "received"; the gateway worker advances them to sent/failed. */
const OUTBOX_INITIAL_STATUS = "received";
const OUTBOX_NO_HASH = "n/a";

/** Compose channels offered to the user (Bahasa Indonesia labels are UI-side). */
export type PesanChannel = "WA" | "Email" | "Notif";

/** Impure: a unique idempotency key for retry-dedup. Components call this. */
export function newIdempotencyKey(): string {
  return `outbox-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function envelope(op: OutboxOp, idempotencyKey: string, response: unknown): OutboxPayload {
  return {
    idempotency_key: idempotencyKey,
    op,
    request_hash: OUTBOX_NO_HASH,
    status: OUTBOX_INITIAL_STATUS,
    response: JSON.stringify(response),
  };
}

/** Build the reply-to-inbox outbox row (the existing, gateway-real flow). */
export function buildReplyPayload(args: {
  inbox: string;
  to: string;
  body: string;
  idempotencyKey: string;
}): OutboxPayload {
  return envelope(OUTBOX_OP.REPLY, args.idempotencyKey, {
    to: args.to,
    inbox: args.inbox,
    body: args.body,
  });
}

/** Build one recipient row of a broadcast campaign, linked back to the broadcast. */
export function buildBroadcastPayload(args: {
  broadcast: string;
  to: string;
  body: string;
  idempotencyKey: string;
}): OutboxPayload {
  return envelope(OUTBOX_OP.BROADCAST, args.idempotencyKey, {
    to: args.to,
    broadcast: args.broadcast,
    body: args.body,
  });
}

/** Build a teacher → parent "Pesan Wali" outbox row, linked to its thread + student. */
export function buildPesanWaliPayload(args: {
  pesanWali: string;
  siswa: string;
  to: string;
  body: string;
  idempotencyKey: string;
}): OutboxPayload {
  return envelope(OUTBOX_OP.PESAN_WALI, args.idempotencyKey, {
    to: args.to,
    siswa: args.siswa,
    body: args.body,
    pesan_wali: args.pesanWali,
  });
}

/**
 * Honest status label for a freshly-queued (not yet gateway-confirmed) dispatch.
 * Never returns "Terkirim" — a queue write cannot prove delivery. WhatsApp is a
 * hand-off to the OS/gateway, so it is qualified explicitly.
 */
export function queuedLabel(channel: PesanChannel): string {
  if (channel === "WA") return "Antre — via WhatsApp";
  return "Antre — menunggu kirim";
}

// ---------------------------------------------------------------------------
// Pesan Wali doc insert (the Guru roster-inline composer)
//
// Unlike the Outbox envelopes above, a teacher → wali message is a plain
// `Pesan Wali` DOC insert: the BE controller (pesan_wali.py) defaults guru/
// thread_key/wali_phone/status and enqueues the Outbox row itself, so the FE
// sends ONLY the authoring fields and never writes the Outbox for this flow.
// ---------------------------------------------------------------------------

/** Kategori options of the Pesan Wali doctype Select (mirrors the BE schema). */
export const PESAN_WALI_KATEGORI = ["Kehadiran", "Akademik", "PR", "Umum"] as const;
export type PesanWaliKategori = (typeof PESAN_WALI_KATEGORI)[number];

/** Channel values of the Pesan Wali doctype. WA needs a wali phone; InApp always lands. */
export const PESAN_WALI_CHANNEL = { WA: "WA", IN_APP: "InApp" } as const;
export type PesanWaliChannel = (typeof PESAN_WALI_CHANNEL)[keyof typeof PESAN_WALI_CHANNEL];

/** Teacher messages are always outbound; replies (arah="masuk") come from the parent API. */
const PESAN_WALI_ARAH_KELUAR = "keluar";

/** The authoring fields of a teacher → wali message (a `type` so it stays assignable to
 * the `Record<string, unknown>` payload that useResourceCreate.mutateAsync expects). */
export type PesanWaliDoc = {
  siswa: string;
  rombel: string;
  kategori: PesanWaliKategori;
  isi: string;
  arah: typeof PESAN_WALI_ARAH_KELUAR;
  channel: PesanWaliChannel;
};

/** Build the `Pesan Wali` insert payload — authoring fields only, draft trimmed. */
export function buildPesanWaliDoc(args: {
  siswa: string;
  rombel: string;
  kategori: PesanWaliKategori;
  isi: string;
  channel: PesanWaliChannel;
}): PesanWaliDoc {
  return {
    siswa: args.siswa,
    rombel: args.rombel,
    kategori: args.kategori,
    isi: args.isi.trim(),
    arah: PESAN_WALI_ARAH_KELUAR,
    channel: args.channel,
  };
}

/** Send gate: a target student and a non-blank draft. */
export function canSendPesanWali(siswa: string, isi: string): boolean {
  return !!siswa && isi.trim().length > 0;
}

/** WA when the primary wali has a phone; otherwise InApp (the thread still reaches the
 * parent app via the wali_pesan API, it just skips the WhatsApp gateway). */
export function pesanWaliChannel(waliPhone: string | null | undefined): PesanWaliChannel {
  return waliPhone ? PESAN_WALI_CHANNEL.WA : PESAN_WALI_CHANNEL.IN_APP;
}

/** Honest post-insert label: WA is a queued gateway hand-off ({@link queuedLabel});
 * for InApp the insert itself is what the parent app reads, so "tercatat" is accurate. */
export function pesanWaliSentLabel(channel: PesanWaliChannel): string {
  if (channel === PESAN_WALI_CHANNEL.WA) return queuedLabel("WA");
  return "Tercatat — tampil di aplikasi wali";
}
