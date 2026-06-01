/**
 * Bagan Akun (Chart of Accounts) — daftar + CRUD akun vernon_accounting.
 *
 * Tambahan presentasi: panduan halaman dan distribusi akun per root type di
 * atas tabel. Logika data (useResourceList / Create / Update + company scope)
 * dan modal CRUD dibiarkan apa adanya.
 */
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  FormField,
  FormGrid,
  Input,
  Modal,
  PageHeader,
  SectionCard,
  Select,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList, useResourceCreate, useResourceUpdate } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  ROOT_TYPES,
  type Account,
  type RootType,
} from "../data/akuntansi";
import { useActiveCompany, withCompanyFilter } from "../lib/akuntansi-scope";
import { DistributionBar, type DistributionSegment, type Tone } from "../components/viz";
import { KeuanganPageGuide } from "../components/keuangan";

const ALL = "Semua";

const ROOT_TYPE_TONE: Record<string, Tone> = {
  Asset: "emerald",
  Liability: "rose",
  Equity: "brand",
  Income: "sky",
  Expense: "amber",
};

const GUIDE_STEPS = [
  { title: "Telusuri struktur akun", detail: "Saring per Root Type (Asset, Liability, Equity, Income, Expense) atau cari nama akun." },
  { title: "Tambah atau ubah akun", detail: "Klik '+ Akun Baru' untuk membuat, atau klik baris untuk menyunting akun yang ada.", roles: ["akuntan"] },
  { title: "Tandai akun group", detail: "Akun group menampung sub-akun dan tidak bisa dipakai langsung untuk posting.", roles: ["akuntan"] },
];

const GUIDE_TIPS = ["Nonaktifkan (Disabled) akun yang tidak dipakai lagi alih-alih menghapusnya."];

function AkunPage() {
  const [q, setQ] = useState("");
  const [root, setRoot] = useState<string>(ALL);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const company = useActiveCompany();

  const list = useResourceList<Account>(DOCTYPE.ACCOUNT, {
    fields: ["name", "account_name", "parent_account", "root_type", "account_type", "is_group", "disabled", "company"],
    filters: withCompanyFilter(undefined, company),
    order_by: "name asc",
    limit_page_length: 0,
  });

  const create = useResourceCreate<Account>(DOCTYPE.ACCOUNT);
  const update = useResourceUpdate<Account>(DOCTYPE.ACCOUNT);

  const rows = useMemo(() => {
    const all = list.data ?? [];
    return all.filter((r) => {
      if (root !== ALL && r.root_type !== root) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!r.account_name?.toLowerCase().includes(needle) && !r.name.toLowerCase().includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [list.data, q, root]);

  /** Account composition by root type for the distribution bar. */
  const rootDistribution = useMemo<DistributionSegment[]>(() => {
    const totals = new Map<string, number>();
    for (const a of list.data ?? []) {
      const rt = a.root_type ?? "Lainnya";
      totals.set(rt, (totals.get(rt) ?? 0) + 1);
    }
    return [...totals.entries()].map(([label, value]) => ({
      label,
      value,
      tone: ROOT_TYPE_TONE[label] ?? "neutral",
    }));
  }, [list.data]);

  const cols: Column<Account>[] = [
    { key: "name", header: "Nama", cell: (r) => <span className="font-mono text-xs">{r.name}</span>, width: "260px" },
    { key: "account_name", header: "Account Name", cell: (r) => r.account_name },
    { key: "parent_account", header: "Parent", cell: (r) => <span className="text-xs text-muted-fg">{r.parent_account ?? "—"}</span> },
    { key: "root_type", header: "Root", cell: (r) => r.root_type ? <Badge tone="brand">{r.root_type}</Badge> : "—" },
    { key: "account_type", header: "Tipe", cell: (r) => r.account_type ?? "—" },
    { key: "is_group", header: "Group", cell: (r) => r.is_group ? <Badge tone="brand">Group</Badge> : "—", align: "center" },
    { key: "disabled", header: "Status", cell: (r) => r.disabled ? <Badge tone="danger">Disabled</Badge> : <Badge tone="success">Aktif</Badge>, align: "center" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bagan Akun"
        description="Chart of Accounts — struktur akun Vernon Accounting."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}>+ Akun Baru</Button>}
      />

      <KeuanganPageGuide
        storageId="akun-coa"
        intro="Bagan Akun adalah fondasi pembukuan. Susun strukturnya sebelum mulai memposting jurnal."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      {rootDistribution.length > 0 && (
        <SectionCard title="Komposisi Akun per Root Type" description={`Total ${list.data?.length ?? 0} akun`}>
          <DistributionBar segments={rootDistribution} />
        </SectionCard>
      )}

      <FilterBar
        search={{ value: q, placeholder: "Cari akun…", onChange: setQ }}
        filters={[
          {
            key: "root", label: "Root Type", value: root,
            options: [{ value: ALL, label: ALL }, ...ROOT_TYPES.map((v) => ({ value: v, label: v }))],
            onChange: setRoot,
          },
        ]}
      />

      <SectionCard padded={false}>
        <DataTable<Account>
          data={rows}
          columns={cols}
          rowKey={(r) => r.name}
          onRowClick={(r) => { setEditing(r); setOpen(true); }}
          empty={<div className="p-8 text-center text-sm text-muted-fg">Tidak ada akun.</div>}
        />
      </SectionCard>

      <AccountModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        company={company}
        onSubmit={async (doc) => {
          if (editing) await update.mutateAsync({ name: editing.name, patch: doc });
          else await create.mutateAsync(doc);
          await list.refetch();
          setOpen(false);
        }}
      />
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  editing: Account | null;
  company: string;
  onSubmit: (doc: Record<string, unknown>) => Promise<void>;
}

function AccountModal({ open, onClose, editing, company, onSubmit }: ModalProps) {
  const [form, setForm] = useState<Partial<Account>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(editing ?? { is_group: 0, disabled: 0 });
  }, [editing, open]);

  const handle = async () => {
    setBusy(true);
    try {
      const doc: Record<string, unknown> = {
        account_name: form.account_name,
        parent_account: form.parent_account ?? null,
        root_type: form.root_type ?? null,
        account_type: form.account_type ?? null,
        is_group: form.is_group ? 1 : 0,
        disabled: form.disabled ? 1 : 0,
        company: form.company ?? company ?? null,
      };
      await onSubmit(doc);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit ${editing.account_name}` : "Akun Baru"}>
      <div className="space-y-3">
        <FormGrid cols={2}>
          <FormField label="Account Name" required>
            <Input value={form.account_name ?? ""} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
          </FormField>
          <FormField label="Parent Account">
            <Input value={form.parent_account ?? ""} onChange={(e) => setForm({ ...form, parent_account: e.target.value })} placeholder="Nama akun induk" />
          </FormField>
          <FormField label="Root Type">
            <Select value={form.root_type ?? ""} onChange={(e) => {
              const v = e.target.value as RootType | "";
              setForm((prev) => {
                const next = { ...prev };
                if (v) next.root_type = v;
                else delete next.root_type;
                return next;
              });
            }}>
              <option value="">—</option>
              {ROOT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </FormField>
          <FormField label="Company" hint="Auto: company sekolah aktif">
            <Input value={form.company ?? company} disabled />
          </FormField>
          <FormField label="Is Group">
            <Select value={String(form.is_group ?? 0)} onChange={(e) => setForm({ ...form, is_group: e.target.value === "1" ? 1 : 0 })}>
              <option value="0">Akun</option>
              <option value="1">Group</option>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={String(form.disabled ?? 0)} onChange={(e) => setForm({ ...form, disabled: e.target.value === "1" ? 1 : 0 })}>
              <option value="0">Aktif</option>
              <option value="1">Disabled</option>
            </Select>
          </FormField>
        </FormGrid>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Batal</Button>
          <Button onClick={handle} disabled={busy || !form.account_name}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </div>
    </Modal>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/buku-besar/akun")({
  component: AkunPage,
});
