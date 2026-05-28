import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, Input, Skeleton } from "@sekolahpro/ui";
import {
  useMySchools,
  useSelectSchool,
  type SekolahCard,
  type SekolahGroup,
} from "../data/sekolah";

const ROLE_TONE: Record<string, string> = {
  Admin: "bg-blue-100 text-blue-700",
  Guru: "bg-violet-100 text-violet-700",
  Siswa: "bg-cyan-100 text-cyan-700",
  "Orang Tua": "bg-amber-100 text-amber-700",
  "Operator PPDB": "bg-emerald-100 text-emerald-700",
};

const STATUS_TONE: Record<string, string> = {
  Aktif: "bg-green-100 text-green-700",
};

export function PilihSekolahPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useMySchools();
  const select = useSelectSchool();
  const [activeOrg, setActiveOrg] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!data || data.total_schools !== 1) return;
    const only = data.groups[0]?.schools[0];
    if (!only) return;
    select.mutate(
      { name: only.sekolah },
      { onSuccess: () => navigate({ to: "/" }) },
    );
  }, [data, select, navigate]);

  const showToolbar = !!data && (data.org_count >= 2 || data.total_schools > 4);

  const filteredGroups: SekolahGroup[] = useMemo(() => {
    if (!data) return [];
    return data.groups
      .filter((g) => activeOrg === "all" || g.organisasi === activeOrg)
      .map((g) => ({
        ...g,
        schools: debouncedQuery
          ? g.schools.filter((s) =>
              s.nama.toLowerCase().includes(debouncedQuery),
            )
          : g.schools,
      }))
      .filter((g) => g.schools.length > 0);
  }, [data, activeOrg, debouncedQuery]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="text-sm text-danger mb-3">Gagal memuat daftar sekolah.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-md border border-border text-sm"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (data.total_schools === 0) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <EmptyState
          title="Belum terdaftar di sekolah manapun"
          description="Hubungi admin sekolah Anda untuk mendapatkan akses."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            Pilih Sekolah
          </h1>
          <p className="text-sm text-muted-fg">
            Anda terdaftar di {data.total_schools} sekolah
            {data.org_count > 1 ? ` pada ${data.org_count} organisasi` : ""}.
          </p>
        </header>

        {showToolbar && (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div
              role="tablist"
              aria-label="Filter organisasi"
              className="flex gap-2 overflow-x-auto"
            >
              <OrgChip
                label="Semua"
                active={activeOrg === "all"}
                onClick={() => setActiveOrg("all")}
              />
              {data.groups.map((g) => (
                <OrgChip
                  key={g.organisasi}
                  label={g.organisasi_nama}
                  active={activeOrg === g.organisasi}
                  onClick={() => setActiveOrg(g.organisasi)}
                />
              ))}
            </div>
            <Input
              type="search"
              placeholder="Cari sekolah..."
              aria-label="Cari sekolah"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>
        )}

        {filteredGroups.length === 0 ? (
          <EmptyState
            title="Tidak ada sekolah cocok"
            description="Coba ubah kata kunci atau filter organisasi."
          />
        ) : (
          filteredGroups.map((group) => (
            <section key={group.organisasi} className="space-y-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-semibold text-fg">
                  {group.organisasi_nama}
                </h2>
                <Badge tone="neutral">{group.schools.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.schools.map((school) => (
                  <SchoolCard
                    key={school.sekolah}
                    school={school}
                    busy={select.isPending}
                    onSelect={() =>
                      select.mutate(
                        { name: school.sekolah },
                        { onSuccess: () => navigate({ to: "/" }) },
                      )
                    }
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function OrgChip(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-pressed={props.active}
      onClick={props.onClick}
      className={
        "px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap " +
        (props.active
          ? "bg-brand text-white border-brand"
          : "bg-bg text-fg border-border hover:bg-muted")
      }
    >
      {props.label}
    </button>
  );
}

function SchoolCard(props: {
  school: SekolahCard;
  busy: boolean;
  onSelect: () => void;
}) {
  const { school } = props;
  const initials = school.nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <Card className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition !p-0 overflow-hidden">
      <button
        type="button"
        onClick={props.onSelect}
        disabled={props.busy}
        className="w-full text-left p-4 flex flex-col gap-3 disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-gradient-to-br from-brand/80 to-brand text-white flex items-center justify-center font-semibold overflow-hidden">
            {school.logo ? (
              <img src={school.logo} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-fg truncate">{school.nama}</div>
            <span
              className={
                "inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium " +
                (ROLE_TONE[school.role_sekolah] ?? "bg-muted text-muted-fg")
              }
            >
              {school.role_sekolah}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-fg">
          <span>
            {[school.jenis, school.tingkat].filter(Boolean).join(" · ") || "—"}
          </span>
          <span
            className={
              "px-2 py-0.5 rounded-full text-[10px] font-medium " +
              (STATUS_TONE[school.status] ?? "bg-muted text-muted-fg")
            }
          >
            {school.status}
          </span>
        </div>
      </button>
    </Card>
  );
}

export const Route = createFileRoute("/pilih-sekolah")({
  component: PilihSekolahPage,
});
