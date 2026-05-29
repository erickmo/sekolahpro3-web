import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@sekolahpro/ui";
import { merchantApi, type CatalogUpsertInput } from "../lib/merchant-api";

const NEW = "new";

interface FormState {
  nama: string;
  harga: number;
  kategori_item: string;
  aktif: boolean;
  track_stok: boolean;
  stok_qty: number;
}

const empty: FormState = {
  nama: "",
  harga: 0,
  kategori_item: "",
  aktif: true,
  track_stok: false,
  stok_qty: 0,
};

function CatalogEditPage() {
  const { name } = useParams({ from: "/_app/catalog/$name" });
  const isNew = name === NEW;
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(empty);
  const [err, setErr] = useState<string | null>(null);

  const item = useQuery({
    queryKey: ["catalog", "item", name],
    queryFn: () => merchantApi.getCatalogItem(name),
    enabled: !isNew,
  });

  useEffect(() => {
    if (item.data) {
      setForm({
        nama: item.data.nama,
        harga: item.data.harga,
        kategori_item: item.data.kategori_item,
        aktif: item.data.aktif,
        track_stok: item.data.track_stok,
        stok_qty: item.data.stok_qty ?? 0,
      });
    }
  }, [item.data]);

  const saveMut = useMutation({
    mutationFn: (input: CatalogUpsertInput) => merchantApi.upsertCatalog(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog"] });
      nav({ to: "/catalog" });
    },
    onError: (e) => setErr((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: () => merchantApi.deleteCatalog(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog"] });
      nav({ to: "/catalog" });
    },
    onError: (e) => setErr((e as Error).message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const payload: CatalogUpsertInput = {
      nama: form.nama,
      harga: Number(form.harga),
      kategori_item: form.kategori_item,
      aktif: form.aktif,
      track_stok: form.track_stok,
      stok_qty: form.track_stok ? Number(form.stok_qty) : null,
    };
    if (!isNew) payload.name = name;
    saveMut.mutate(payload);
  };

  if (!isNew && item.isLoading) return <div className="p-4">Memuat…</div>;

  return (
    <form onSubmit={onSubmit} className="p-4 flex flex-col gap-3 max-w-md">
      <h1 className="text-xl font-semibold">{isNew ? "Item baru" : `Edit ${name}`}</h1>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Nama</span>
        <input
          required
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          className="border p-2 rounded"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Harga</span>
        <input
          type="number"
          min={0}
          required
          value={form.harga}
          onChange={(e) => setForm({ ...form, harga: Number(e.target.value) })}
          className="border p-2 rounded tabular-nums"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Kategori item</span>
        <input
          required
          value={form.kategori_item}
          onChange={(e) => setForm({ ...form, kategori_item: e.target.value })}
          className="border p-2 rounded"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.aktif}
          onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
        />
        <span>Aktif</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.track_stok}
          onChange={(e) => setForm({ ...form, track_stok: e.target.checked })}
        />
        <span>Track stok</span>
      </label>

      {form.track_stok && (
        <label className="flex flex-col gap-1">
          <span className="text-sm">Stok qty</span>
          <input
            type="number"
            min={0}
            value={form.stok_qty}
            onChange={(e) => setForm({ ...form, stok_qty: Number(e.target.value) })}
            className="border p-2 rounded tabular-nums"
          />
        </label>
      )}

      {err && (
        <div role="alert" className="text-red-600 text-sm">
          {err}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <Button type="submit" disabled={saveMut.isPending}>
          {saveMut.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
        {!isNew && (
          <Button
            type="button"
            variant="destructive"
            disabled={deleteMut.isPending}
            onClick={() => {
              if (confirm("Hapus item ini?")) deleteMut.mutate();
            }}
          >
            {deleteMut.isPending ? "Menghapus…" : "Hapus"}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={() => nav({ to: "/catalog" })}>
          Batal
        </Button>
      </div>
    </form>
  );
}

export const Route = createFileRoute("/_app/catalog/$name")({ component: CatalogEditPage });
