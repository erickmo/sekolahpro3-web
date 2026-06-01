/**
 * Peran (user roles) configuration panel.
 *
 * Pure presentational panel extracted from the Pengaturan god-file (PeranTab +
 * PeranModal + PeranTambahModal), behavior preserved 1:1. Adds a "Distribusi
 * Pengguna" visualization header (HBarChart of users-per-role) above the table.
 *
 * UI strings are Bahasa Indonesia; code comments are English (house rule).
 */
import { useState } from "react";
import {
  Badge,
  Button,
  type Column,
  DataTable,
  FormField,
  FormGrid,
  Input,
  Modal,
  SectionCard,
  Textarea,
  IconPlus,
} from "@sekolahpro/ui";
import type { Peran } from "../../data/pengaturan";
import { roleDistribution } from "../../lib/pengaturanSummary";
import { HBarChart } from "../viz/charts";
import { ModalFooter, SavedFlash } from "./pengaturanShared";

/** Flash key used by every save in this panel. */
const FLASH_KEY = "peran";

/** Empty draft for a brand-new custom role. */
const EMPTY_PERAN: Peran = { nama: "", jumlahUser: 0, permission: 0, deskripsi: "", builtIn: false };

/** Props for {@link PeranPanel} — identical to the original PeranTab. */
export interface PeranPanelProps {
  list: Peran[];
  setList: (v: Peran[]) => void;
  flash: (k: string) => void;
  flashKey: string | null;
}

/**
 * Edit-an-existing-role modal.
 *
 * @param open whether the modal is shown.
 * @param onClose handler to dismiss the modal.
 * @param value the role being edited.
 * @param onSave handler receiving the edited role.
 * @returns the modal element.
 */
function PeranModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Peran; onSave: (v: Peran) => void }) {
  const [draft, setDraft] = useState<Peran>(value);
  return (
    <Modal open={open} onClose={onClose} title={`Edit Peran: ${value.nama}`} footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Nama Peran" required className="sm:col-span-2"><Input value={draft.nama} onChange={(e) => setDraft({ ...draft, nama: e.target.value })} disabled={draft.builtIn} /></FormField>
        <FormField label="Deskripsi" className="sm:col-span-2"><Textarea value={draft.deskripsi} onChange={(e) => setDraft({ ...draft, deskripsi: e.target.value })} rows={2} /></FormField>
        <FormField label="Jumlah Permission"><Input type="number" value={draft.permission} onChange={(e) => setDraft({ ...draft, permission: Number(e.target.value) })} /></FormField>
        <FormField label="Jumlah User" hint="Read-only"><Input type="number" value={draft.jumlahUser} disabled /></FormField>
      </FormGrid>
    </Modal>
  );
}

/**
 * Add-a-custom-role modal. Save is ignored when the name is blank.
 *
 * @param open whether the modal is shown.
 * @param onClose handler to dismiss the modal.
 * @param onSave handler receiving the new role.
 * @returns the modal element.
 */
function PeranTambahModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (v: Peran) => void }) {
  const [draft, setDraft] = useState<Peran>(EMPTY_PERAN);
  return (
    <Modal open={open} onClose={onClose} title="Tambah Peran Custom" footer={<ModalFooter onCancel={onClose} onSave={() => { if (draft.nama.trim()) onSave(draft); }} />}>
      <FormGrid cols={2}>
        <FormField label="Nama Peran" required className="sm:col-span-2"><Input value={draft.nama} onChange={(e) => setDraft({ ...draft, nama: e.target.value })} placeholder="contoh: Pembina OSIS" /></FormField>
        <FormField label="Deskripsi" className="sm:col-span-2"><Textarea value={draft.deskripsi} onChange={(e) => setDraft({ ...draft, deskripsi: e.target.value })} rows={2} /></FormField>
        <FormField label="Jumlah Permission"><Input type="number" value={draft.permission} onChange={(e) => setDraft({ ...draft, permission: Number(e.target.value) })} /></FormField>
      </FormGrid>
    </Modal>
  );
}

/**
 * Visualization header: a "Distribusi Pengguna" card with an HBarChart of the
 * user count per role.
 *
 * @param list the role list.
 * @returns the SectionCard with the chart.
 */
function DistribusiPenggunaHeader({ list }: { list: Peran[] }) {
  return (
    <SectionCard title="Distribusi Pengguna" description="Jumlah pengguna aktif per peran">
      <HBarChart data={roleDistribution(list)} />
    </SectionCard>
  );
}

/**
 * Roles management panel: distribution chart header plus an editable table of
 * built-in and custom roles, with add/edit/delete modals.
 *
 * @param list the roles.
 * @param setList commit a new role list.
 * @param flash trigger a save-flash by key.
 * @param flashKey the currently flashing key.
 * @returns the panel element.
 */
export function PeranPanel({ list, setList, flash, flashKey }: PeranPanelProps) {
  const [editing, setEditing] = useState<Peran | null>(null);
  const [adding, setAdding] = useState(false);

  const cols: Column<Peran>[] = [
    { key: "nama", header: "Peran", cell: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{r.nama}</span>
        {r.builtIn ? <Badge tone="neutral">Built-in</Badge> : <Badge tone="brand">Custom</Badge>}
      </div>
    ) },
    { key: "deskripsi", header: "Deskripsi", cell: (r) => <span className="text-sm text-muted-fg">{r.deskripsi}</span> },
    { key: "user", header: "User", align: "right", cell: (r) => <span className="tabular-nums">{r.jumlahUser}</span> },
    { key: "perm", header: "Permission", align: "right", cell: (r) => <span className="tabular-nums text-muted-fg">{r.permission}</span> },
    { key: "aksi", header: "", align: "right", cell: (r) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>Edit</Button>
        {!r.builtIn && (
          <Button variant="ghost" size="sm" onClick={() => { setList(list.filter((p) => p.nama !== r.nama)); flash(FLASH_KEY); }}>Hapus</Button>
        )}
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <DistribusiPenggunaHeader list={list} />
      <SectionCard
        title={<span>Peran Pengguna<SavedFlash show={flashKey === FLASH_KEY} /></span>}
        description={`${list.length} peran terdaftar`}
        action={<Button size="sm" onClick={() => setAdding(true)}><span className="h-3.5 w-3.5 mr-1"><IconPlus /></span>Tambah Peran</Button>}
        padded={false}
      >
        <DataTable data={list} columns={cols} rowKey={(r) => r.nama} />
      </SectionCard>
      {editing && (
        <PeranModal
          open
          onClose={() => setEditing(null)}
          value={editing}
          onSave={(v) => { setList(list.map((p) => (p.nama === editing.nama ? v : p))); setEditing(null); flash(FLASH_KEY); }}
        />
      )}
      <PeranTambahModal
        open={adding}
        onClose={() => setAdding(false)}
        onSave={(v) => { setList([...list, v]); setAdding(false); flash(FLASH_KEY); }}
      />
    </div>
  );
}
