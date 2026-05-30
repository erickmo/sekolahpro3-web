import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import {
  SLOT_OVERRIDE_BASE_VALUES,
  SLOT_OVERRIDE_FIELDS,
} from "../data/create-schemas";

type Row = { name: string; jadwal_override?: string; slot_jadwal?: string; tipe?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "jadwal_override", header: "Override", cell: (r) => r.jadwal_override ?? "—" },
  { key: "slot_jadwal", header: "Slot", cell: (r) => r.slot_jadwal ?? "—" },
  { key: "tipe", header: "Tipe", cell: (r) => r.tipe ?? "—" },
];

function SlotOverridePage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Jadwal"
        title="Slot Override"
        doctype="Slot Override"
        fields={["name"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "name", dir: "desc" }}
        searchFields={["name"]}
        addLabel="Tambah Slot Override"
        onAdd={() => setOpen(true)}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Slot Override"
        title="Tambah Slot Override"
        description="Baris slot pada header Jadwal Override terpilih."
        fields={SLOT_OVERRIDE_FIELDS}
        baseValues={SLOT_OVERRIDE_BASE_VALUES}
      />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal/slot-override")({ component: SlotOverridePage });
