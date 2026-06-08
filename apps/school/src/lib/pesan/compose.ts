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
