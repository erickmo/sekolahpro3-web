/**
 * ConversationView — the right pane of the "Masuk" inbox lane: the selected message
 * plus the reply composer. Extracted verbatim from the original sch.$sekolah.pesan.tsx
 * route (behavior unchanged) so it is reusable and the route/desk stays thin.
 */
import { Avatar, Badge, Button, IconClock } from "@sekolahpro/ui";
import { formatWaktu, stripHtml, STATUS_TONE, type InboxRow } from "../../lib/pesan/inbox";

interface ConversationViewProps {
  pesan: InboxRow;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
}

export function ConversationView({ pesan, draft, onDraftChange, onSend, sending }: ConversationViewProps) {
  return (
    <>
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <Avatar name={pesan.nama} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-fg truncate">{pesan.nama}</h2>
            <Badge tone={STATUS_TONE[pesan.status ?? "Baru"] ?? "neutral"} dot>
              {pesan.status ?? "Baru"}
            </Badge>
          </div>
          <div className="text-xs text-muted-fg mt-0.5">
            {pesan.email ?? "—"} {pesan.telepon ? `· ${pesan.telepon}` : ""}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 max-h-[420px]">
        <div className="flex justify-start">
          <div className="max-w-[75%] flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[11px] text-muted-fg">
              <span className="font-medium text-fg/80">{pesan.nama}</span>
              <span className="tabular-nums inline-flex items-center gap-0.5">
                <span className="h-3 w-3"><IconClock /></span>
                {formatWaktu(pesan.submitted_at ?? pesan.creation)}
              </span>
            </div>
            <div className="bg-muted text-fg rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm whitespace-pre-wrap">
              {stripHtml(pesan.pesan ?? "")}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Tulis balasan..."
          rows={2}
          className="flex-1 resize-none rounded-md border border-border bg-bg px-3 py-2 text-sm placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <Button onClick={onSend} disabled={!draft.trim() || sending}>
          {sending ? "Mengirim..." : "Kirim"}
        </Button>
      </div>
    </>
  );
}
