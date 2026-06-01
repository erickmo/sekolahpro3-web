// PERP-ADR-0001 — ReturnModal: catat pengembalian buku via Frappe doctype
// `Pengembalian Buku`. Flow dua-langkah (insert → submit) supaya backend
// bisa auto-generate Denda Perpustakaan ketika telat.
import { useState, type ReactNode } from "react";
import { Button, DatePicker, FormField, FormGrid, Modal, Textarea } from "@sekolahpro/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { perpToday } from "./perpFormatters";
import { insertAndSubmit } from "./circulation";

const DOCTYPE = "Pengembalian Buku";
const PEMINJAMAN_DOCTYPE = "Peminjaman Buku";
const DENDA_DOCTYPE = "Denda Perpustakaan";

// Return date is transactional (today-ish), so a narrow recent year range
// suffices for fast year jumping in the datepicker.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

/** Section heading + grid wrapper for one logical group of fields. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description ? <p className="text-xs text-muted-fg mt-0.5">{description}</p> : null}
      </div>
      <FormGrid cols={2}>{children}</FormGrid>
    </section>
  );
}

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
      return insertAndSubmit<ReturnDoc>(DOCTYPE, {
        peminjaman,
        tanggal_kembali_aktual: tanggal,
        catatan: catatan || undefined,
      });
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
      description={`Catat pengembalian untuk ${peminjaman}. Tanda * wajib diisi.`}
      size="mega"
      tone="brand"
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
      <FormSection
        title="Pengembalian"
        description="Tanggal aktual buku dikembalikan dan catatan opsional."
      >
        <FormField label="Tanggal Kembali" required htmlFor="ret-date">
          <DatePicker
            id="ret-date"
            value={tanggal}
            onChange={(v) => setTanggal(v)}
            captionLayout="dropdown-buttons"
            fromYear={MIN_YEAR}
            toYear={MAX_YEAR}
          />
        </FormField>
        <FormField label="Catatan" htmlFor="ret-note" className="col-span-2">
          <Textarea
            id="ret-note"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </FormField>
      </FormSection>
    </Modal>
  );
}
