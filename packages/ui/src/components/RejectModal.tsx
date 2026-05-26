import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "../primitives/button";
import { Textarea } from "../primitives/textarea";
import { Checkbox } from "../primitives/checkbox";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, notify: boolean) => void;
  entityName: string;
  minLength?: number;
  pending?: boolean;
}

const DEFAULT_MIN_REASON = 20;

export function RejectModal({
  open,
  onClose,
  onSubmit,
  entityName,
  minLength = DEFAULT_MIN_REASON,
  pending = false,
}: Props) {
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);

  const trimmed = reason.trim();
  const ok = trimmed.length >= minLength;

  function handleSubmit() {
    if (!ok || pending) return;
    onSubmit(trimmed, notify);
  }

  function handleClose() {
    if (pending) return;
    setReason("");
    setNotify(true);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Tolak ${entityName}?`}
      description="Alasan akan dicatat di audit trail dan dikirim ke pemohon."
      tone="rose"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={pending}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!ok || pending}>
            {pending ? "Menolak…" : "Tolak"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-fg">
            Alasan penolakan <span className="text-danger">*</span>
          </span>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Minimal ${minLength} karakter — jelaskan alasan penolakan agar pemohon bisa memperbaiki.`}
            rows={5}
            disabled={pending}
          />
          <div className="mt-1 flex justify-between text-xs">
            <span className={ok ? "text-emerald-600" : "text-muted-fg"}>
              {trimmed.length}/{minLength} karakter
            </span>
            {!ok && trimmed.length > 0 ? (
              <span className="text-amber-600">Alasan terlalu pendek</span>
            ) : null}
          </div>
        </label>
        <Checkbox
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          label="Kirim notifikasi ke pemohon"
        />
      </div>
    </Modal>
  );
}
