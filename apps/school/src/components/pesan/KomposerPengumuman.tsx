/**
 * KomposerPengumuman — compose an official broadcast (Pesan Broadcast) and route it to the
 * Kepsek for approval. Creates the doc (workflow_state defaults to "Draf" in the BE
 * controller) then applies the "Ajukan" transition → "Menunggu Kepsek".
 *
 * MVP audience = "Semua Wali" (the common official announcement). Richer per-rombel /
 * per-jenjang targeting (resolve_pesan_audience supports it) is a follow-up; the count
 * preview already calls the server resolver.
 */
import { useState } from "react";
import {
  Button,
  FormField,
  Input,
  Modal,
  SearchableSelect,
  Textarea,
} from "@sekolahpro/ui";
import { useResourceCreate, useFrappeMutation } from "@sekolahpro/api-client";
import { useResolveAudience } from "../../lib/pesan/pesanApi";

const BROADCAST_DOCTYPE = "Pesan Broadcast";
const AUDIENCE_SEMUA_WALI = "semua_wali";
const ACTION_AJUKAN = "Ajukan";
const CHANNELS = ["WA", "Email", "Notif"] as const;

interface Props {
  open: boolean;
  sekolah: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function KomposerPengumuman({ open, sekolah, onClose, onSubmitted }: Props) {
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [channel, setChannel] = useState<string>("WA");
  const [err, setErr] = useState<string | null>(null);

  const create = useResourceCreate<{ name: string }>(BROADCAST_DOCTYPE);
  const apply = useFrappeMutation<{ doctype: string; docname: string; action: string }>(
    "frappe.model.workflow.apply_workflow",
  );
  const audience = useResolveAudience(sekolah, AUDIENCE_SEMUA_WALI, {}, open);

  const pending = create.isPending || apply.isPending;
  const canSubmit = !!judul.trim() && !!isi.trim() && !pending;

  const reset = () => {
    setJudul("");
    setIsi("");
    setChannel("WA");
    setErr(null);
  };

  const close = () => {
    if (pending) return;
    reset();
    onClose();
  };

  const submit = async () => {
    setErr(null);
    try {
      const doc = await create.mutateAsync({
        judul: judul.trim(),
        audiens_type: AUDIENCE_SEMUA_WALI,
        isi: isi.trim(),
        channel,
      });
      // Route to the Kepsek approval gate (Draf → Menunggu Kepsek).
      await apply.mutateAsync({ doctype: BROADCAST_DOCTYPE, docname: doc.name, action: ACTION_AJUKAN });
      reset();
      onSubmitted?.();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat pengumuman.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="mega"
      title="Pengumuman Resmi"
      description="Susun pengumuman untuk seluruh wali. Setelah diajukan, menunggu persetujuan Kepala Sekolah."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={pending}>Batal</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {pending ? "Mengirim..." : "Ajukan ke Kepala Sekolah"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FormField label="Judul" required>
          <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="mis. Libur Semester Genap" />
        </FormField>

        <FormField label="Audiens">
          <div className="flex items-center gap-2 text-sm text-fg">
            <span className="rounded-md bg-muted px-2 py-1 font-medium">Semua Wali</span>
            <span className="text-muted-fg">
              {audience.isLoading
                ? "menghitung penerima..."
                : `→ ${(audience.data?.count ?? 0).toLocaleString("id-ID")} penerima`}
            </span>
          </div>
        </FormField>

        <FormField label="Kanal">
          <SearchableSelect
            value={channel}
            onChange={setChannel}
            options={CHANNELS.map((c) => ({ value: c, label: c }))}
            placeholder="— pilih —"
          />
        </FormField>

        <FormField label="Isi Pengumuman" required>
          <Textarea rows={6} value={isi} onChange={(e) => setIsi(e.target.value)} placeholder="Tulis isi pengumuman..." />
        </FormField>

        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">{err}</div>
        )}
      </div>
    </Modal>
  );
}
