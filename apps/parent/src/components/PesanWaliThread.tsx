/**
 * PesanWaliThread — the parent's 2-way conversation with a child's teacher (BE Fase 2).
 * Renders the thread as chat bubbles (teacher left, parent right) and lets the parent reply
 * to the latest teacher message. Reply marks the source teacher message "Dibalas".
 */
import { useState } from "react";
import { SectionCard, Button } from "@sekolahpro/ui";
import { useReplyWali, useWaliThread } from "../data/pesanWali";

interface Props {
  nis: string | null;
  childName?: string | undefined;
}

export function PesanWaliThread({ nis, childName }: Props) {
  const [draft, setDraft] = useState("");
  const thread = useWaliThread(nis);
  const reply = useReplyWali(nis);

  const messages = thread.data ?? [];
  // The parent replies to the most recent teacher (keluar) message in the thread.
  const latestKeluar = [...messages].reverse().find((m) => m.arah === "keluar");
  const canReply = !!nis && !!latestKeluar && !!draft.trim() && !reply.isPending;

  const send = async () => {
    if (!latestKeluar || !draft.trim()) return;
    try {
      await reply.mutateAsync({ pesan_wali: latestKeluar.name, isi: draft.trim() });
      setDraft("");
    } catch {
      // error surfaced via reply.error below
    }
  };

  return (
    <SectionCard title={`Pesan dari Guru${childName ? ` · ${childName}` : ""}`} padded={false}>
      {thread.isLoading ? (
        <div className="px-5 py-4 text-sm text-muted-fg">Memuat…</div>
      ) : messages.length === 0 ? (
        <div className="px-5 py-4 text-sm text-muted-fg">Belum ada pesan dari guru.</div>
      ) : (
        <ul className="px-5 py-4 space-y-2 max-h-[420px] overflow-y-auto">
          {messages.map((m) => (
            <li key={m.name} className={m.arah === "masuk" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  (m.arah === "masuk" ? "bg-brand text-white rounded-tr-sm" : "bg-muted text-fg rounded-tl-sm") +
                  " max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap"
                }
              >
                {m.isi}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border p-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          disabled={!latestKeluar}
          placeholder={latestKeluar ? "Tulis balasan…" : "Belum ada pesan untuk dibalas"}
          className="flex-1 resize-none rounded-md border border-border bg-bg px-3 py-2 text-sm placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
        />
        <Button onClick={send} disabled={!canReply}>
          {reply.isPending ? "Mengirim…" : "Balas"}
        </Button>
      </div>
      {reply.error ? (
        <div className="px-3 pb-3 text-xs text-rose-700">{reply.error.message}</div>
      ) : null}
    </SectionCard>
  );
}
