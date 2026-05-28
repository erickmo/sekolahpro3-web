import { useState } from "react";
import { Button } from "@sekolahpro/ui";
import type { PickupEvent } from "../data/pickup-types";

interface Props {
  event: PickupEvent;
  isWaitingParent: boolean;
  isCompleting: boolean;
  isDeclining: boolean;
  onComplete: () => void;
  onDecline: (note: string) => void;
}

export function PickupReleaseCard({
  event,
  isWaitingParent,
  isCompleting,
  isDeclining,
  onComplete,
  onDecline,
}: Props) {
  const [showDecline, setShowDecline] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div className="space-y-4 rounded-lg border border-border bg-bg p-4">
      <div className="flex items-center gap-4">
        {event.childPhotoUrl ? (
          <img src={event.childPhotoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand/15 text-xl font-semibold text-brand">
            {event.childNama.charAt(0)}
          </span>
        )}
        <div>
          <div className="font-semibold text-fg">{event.childNama}</div>
          <div className="text-xs text-muted-fg">{event.childKelas} · NIS {event.nis}</div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        <div className="text-muted-fg text-xs">Penjemput</div>
        <div className="font-medium text-fg">
          {event.pickupPersonNama} <span className="text-muted-fg">· {event.pickupPersonHubungan}</span>
        </div>
        <div className="text-xs text-muted-fg">{event.pickupPersonPhone}</div>
      </div>

      {isWaitingParent ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Menunggu konfirmasi orang tua…
        </div>
      ) : null}

      {showDecline ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-fg" htmlFor="decline-note">Catatan insiden</label>
          <textarea
            id="decline-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-2 py-1.5 text-sm"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setShowDecline(false)} className="bg-muted text-fg">Batal</Button>
            <Button type="button" disabled={!note.trim() || isDeclining} onClick={() => onDecline(note.trim())} className="bg-rose-600">Catat & Tolak</Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={() => setShowDecline(true)} className="bg-muted text-fg">Tahan / Ragu</Button>
          <Button type="button" disabled={isWaitingParent || isCompleting} onClick={onComplete}>Lepaskan Siswa</Button>
        </div>
      )}
    </div>
  );
}
