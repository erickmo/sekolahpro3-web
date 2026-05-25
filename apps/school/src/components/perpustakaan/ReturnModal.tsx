// PERP-ADR-0001 — ReturnModal: catat pengembalian buku via Frappe doctype
// `Pengembalian Buku`. Flow dua-langkah (insert → submit) supaya backend
// bisa auto-generate Denda Perpustakaan ketika telat.
import { useState } from "react";
import { Button, FormField, Input, Modal, Textarea } from "@sekolahpro/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { frappeFetch } from "@sekolahpro/api-client";
import { perpToday } from "./perpFormatters";

const DOCTYPE = "Pengembalian Buku";
const PEMINJAMAN_DOCTYPE = "Peminjaman Buku";
const DENDA_DOCTYPE = "Denda Perpustakaan";

interface ReturnDoc {
  name: string;
  total_denda?: number;
  docstatus?: number;
}

interface Props {
  open: boolean;
  peminjaman: string;
  onClose: () => void;
  onSuccess: (doc: ReturnDoc) => void;
}

/**
 * ReturnModal renders a small form to capture the actual return date plus
 * an optional note, then performs two sequential Frappe RPC calls:
 *   1. `frappe.client.insert` — create draft `Pengembalian Buku`.
 *   2. `frappe.client.submit` — submit it; backend hook auto-creates the
 *      `Denda Perpustakaan` row if the return is late.
 * On success, peminjaman + denda caches are invalidated and `onSuccess`
 * is invoked with the submitted doc (includes `total_denda`).
 * On failure, the error message is rendered inside a `role="alert"` div.
 */
export function ReturnModal({ open, peminjaman, onClose, onSuccess }: Props) {
  const qc = useQueryClient();
  const [tanggal, setTanggal] = useState(perpToday());
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation<ReturnDoc, Error>({
    mutationFn: async () => {
      setError(null);
      const inserted = await frappeFetch<{ name: string }>(
        "frappe.client.insert",
        {
          doc: {
            doctype: DOCTYPE,
            peminjaman,
            tanggal_kembali_aktual: tanggal,
            catatan: catatan || undefined,
          },
        },
      );
      const submitted = await frappeFetch<ReturnDoc>("frappe.client.submit", {
        doc: { doctype: DOCTYPE, name: inserted.name },
      });
      return submitted;
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["resource:list", PEMINJAMAN_DOCTYPE] });
      qc.invalidateQueries({
        queryKey: ["resource:doc", PEMINJAMAN_DOCTYPE, peminjaman],
      });
      qc.invalidateQueries({ queryKey: ["resource:list", DENDA_DOCTYPE] });
      onSuccess(doc);
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kembalikan Buku"
      description={`Catat pengembalian untuk ${peminjaman}.`}
      size="sm"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Batal
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            Simpan
          </Button>
        </>
      }
    >
      {error && (
        <div role="alert" className="mb-3 text-sm text-danger">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-3">
        <FormField label="Tanggal Kembali" required htmlFor="ret-date">
          <Input
            id="ret-date"
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </FormField>
        <FormField label="Catatan" htmlFor="ret-note">
          <Textarea
            id="ret-note"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </FormField>
      </div>
    </Modal>
  );
}
