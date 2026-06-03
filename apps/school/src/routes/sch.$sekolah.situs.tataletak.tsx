import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  Select,
  SkeletonText,
  Switch,
  Textarea,
} from "@sekolahpro/ui";
import { useSitus, useSaveSitus, type BlockTipe, type LayoutBlockRow } from "../data/situs";
import { useUnsavedChanges } from "../lib/useUnsavedChanges";
import {
  BLOCK_TIPE_OPTIONS,
  BLOCK_TIPE_LABELS,
  BLOCK_VARIANTS,
  BLOCK_FIELDS_BY_TYPE,
  LAYOUT_BLOCK_FIELDS,
} from "../features/situs/blockSchemas";
import { PageGuide } from "../components/guide";
import { SITUS_PAGE_GUIDES } from "../components/situs/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

/** Pure array move helper — out-of-range targets are no-ops. */
function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  if (item === undefined) return arr;
  next.splice(to, 0, item);
  return next;
}

/** A fresh block defaulting to its tipe's first declared variant (else "default"). */
function newBlock(tipe: BlockTipe): LayoutBlockRow {
  return { tipe, variant: BLOCK_VARIANTS[tipe][0] ?? "default", aktif: 1 };
}

/** Per-block variant picker plus only the presentational fields this tipe uses. */
function BlockEditor({ block, onChange }: { block: LayoutBlockRow; onChange: (b: LayoutBlockRow) => void }) {
  // Hide fields the renderer ignores for this block tipe (e.g. CTA fields on a
  // richtext block, all text fields on adapter blocks like berita/agenda).
  const fields = LAYOUT_BLOCK_FIELDS.filter((f) => BLOCK_FIELDS_BY_TYPE[block.tipe].includes(f.name));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FormField label="Varian">
        <Select aria-label="Varian" value={block.variant} onChange={(e) => onChange({ ...block, variant: e.target.value })}>
          {BLOCK_VARIANTS[block.tipe].map((v) => <option key={v} value={v}>{v}</option>)}
        </Select>
      </FormField>
      {fields.map((f) => {
        const value = String((block as unknown as Record<string, unknown>)[f.name] ?? "");
        const set = (v: string) => onChange({ ...block, [f.name]: v });
        return (
          <FormField key={f.name} label={f.label}>
            {f.type === "textarea" || f.type === "richtext" ? (
              <Textarea rows={f.type === "richtext" ? 4 : 2} value={value} onChange={(e) => set(e.target.value)} />
            ) : (
              <Input value={value} onChange={(e) => set(e.target.value)} />
            )}
          </FormField>
        );
      })}
    </div>
  );
}

/** Layout builder: order/toggle/configure the situs section blocks. */
export function TataLetakPage({ sekolah }: { sekolah: string }) {
  const { data, isLoading, isError, refetch } = useSitus(sekolah);
  const save = useSaveSitus(sekolah);
  const [blocks, setBlocks] = useState<LayoutBlockRow[]>([]);
  const [pick, setPick] = useState<BlockTipe>(BLOCK_TIPE_OPTIONS[0]);

  // Seed local edits from the server array whenever a fresh copy arrives.
  useEffect(() => { if (data?.layout_blocks) setBlocks(data.layout_blocks); }, [data]);

  const patch = (i: number, b: LayoutBlockRow) => setBlocks(blocks.map((x, idx) => (idx === i ? b : x)));
  const reorder = (i: number, dir: -1 | 1) => setBlocks(move(blocks, i, i + dir));
  const remove = (i: number) => setBlocks(blocks.filter((_, idx) => idx !== i));
  const add = () => setBlocks([...blocks, newBlock(pick)]);

  // Warn on tab close while the layout diverges from the loaded blocks. Hook sits
  // above the loading/error early returns to keep call order stable.
  useUnsavedChanges(!!data?.layout_blocks && JSON.stringify(blocks) !== JSON.stringify(data.layout_blocks));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Tata Letak" description="Memuat tata letak situs…" />
        <Card className="p-4"><SkeletonText lines={5} /></Card>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Tata Letak" description="Susun urutan, aktif/nonaktif, dan varian tiap bagian beranda situs." />
        <Card className="space-y-3 p-4">
          <p className="text-sm text-rose-600">Gagal memuat tata letak. Coba muat ulang.</p>
          <Button variant="ghost" onClick={() => refetch()}>Muat ulang</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tata Letak"
        description="Susun urutan, aktif/nonaktif, dan varian tiap bagian beranda situs."
        actions={
          <Button onClick={() => save.mutate({ layout_blocks: blocks })} disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan Tata Letak"}
          </Button>
        }
      />

      <PageGuide
        storageNamespace="situs-guide:"
        storageId="tataletak"
        title={SITUS_PAGE_GUIDES.tataletak.title}
        intro={SITUS_PAGE_GUIDES.tataletak.intro}
        steps={SITUS_PAGE_GUIDES.tataletak.steps}
        tips={SITUS_PAGE_GUIDES.tataletak.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <FormField label="Tambah blok">
          <Select aria-label="Tambah blok" value={pick} onChange={(e) => setPick(e.target.value as BlockTipe)}>
            {BLOCK_TIPE_OPTIONS.map((t) => <option key={t} value={t}>{BLOCK_TIPE_LABELS[t]}</option>)}
          </Select>
        </FormField>
        <Button variant="ghost" onClick={add}>+ Tambah Blok</Button>
      </Card>

      {blocks.length === 0 ? (
        <EmptyState title="Belum ada blok" description="Tambahkan blok lalu simpan tata letak." />
      ) : (
        <div className="space-y-3">
          {blocks.map((block, i) => (
            <Card key={i} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-800">{`#${i + 1} · ${BLOCK_TIPE_LABELS[block.tipe]}`}</span>
                <div className="flex items-center gap-2">
                  <Switch checked={Boolean(block.aktif)} onChange={(next) => patch(i, { ...block, aktif: next ? 1 : 0 })} label="Aktif" />
                  <Button variant="ghost" size="sm" aria-label="Naikkan" disabled={i === 0} onClick={() => reorder(i, -1)}>↑</Button>
                  <Button variant="ghost" size="sm" aria-label="Turunkan" disabled={i === blocks.length - 1} onClick={() => reorder(i, 1)}>↓</Button>
                  <Button variant="ghost" size="sm" aria-label="Hapus" onClick={() => remove(i)}>Hapus</Button>
                </div>
              </div>
              <BlockEditor block={block} onChange={(b) => patch(i, b)} />
            </Card>
          ))}
        </div>
      )}

      {save.isError ? <p className="text-sm text-rose-600">Gagal menyimpan tata letak.</p> : null}
    </div>
  );
}

function TataLetakRoute() {
  const { sekolah } = Route.useParams();
  return <TataLetakPage sekolah={sekolah} />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/tataletak")({ component: TataLetakRoute });
