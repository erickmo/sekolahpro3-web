import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AttentionList,
  Badge,
  Button,
  PageHeader,
  SectionCard,
  StatCard,
  IconAlert,
  IconBook,
  IconCalendar,
  IconClock,
  IconUsers,
} from "@sekolahpro/ui";
import type { AttentionItem } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

// TODO(/jadwal/): Jadwal Pelajaran header doctype lacks per-slot fields
// (hari, jam_mulai, mapel, kelas, guru). Real per-slot data is in child
// table `slots` (Slot Jadwal). Field names here are best-guess for a
// future flattened/view endpoint.
type JadwalRow = {
  name: string;
  hari?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  mapel?: string;
  kelas?: string;
  rombel?: string;
  guru?: string;
  is_aktif?: number;
};

const HARI_INI = "Senin";
const TANGGAL_HARI_INI = "Senin, 25 Mei 2026";

// COO actionable stubs — angka kecil agar realistis hingga data sungguhan wired.
// TODO(/jadwal/): turunkan dari child `slots` + override doctype.
const STUB_KONFLIK_SLOT = 0;
const STUB_OVERRIDE_AKTIF = 1;
const STUB_GURU_IZIN_DAMPAK = 2;

const QUICK_LINKS: { to: string; label: string; description: string }[] = [
  { to: "/jadwal/daftar", label: "Jadwal Pelajaran", description: "Lihat grid & daftar mingguan" },
  { to: "/jadwal/slot", label: "Slot Jadwal", description: "Definisi jam pelajaran" },
  { to: "/jadwal/override", label: "Jadwal Override", description: "Libur & hari khusus" },
  { to: "/jadwal/slot-override", label: "Slot Override", description: "Penyesuaian slot per hari" },
];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  return (h ?? 0) * 60 + (m ?? 0);
}

function JadwalDashboardPage() {
  const q = useResourceList<JadwalRow>("Jadwal Pelajaran", {
    fields: ["name", "jam_selesai", "rombel", "is_aktif"],
    limit_page_length: 0,
  });
  const rows = q.data ?? [];

  const stats = useMemo(() => {
    const todays = rows.filter((s) => s.hari === HARI_INI);
    const aktifHariIni = todays.filter((s) => s.is_aktif).length;
    const kelasField = (s: JadwalRow) => s.kelas ?? s.rombel ?? "";
    const kelasSemua = new Set(rows.map(kelasField).filter(Boolean));
    const kelasHariIni = new Set(todays.map(kelasField).filter(Boolean));
    let kelasTanpaJadwal = 0;
    for (const k of kelasSemua) if (!kelasHariIni.has(k)) kelasTanpaJadwal += 1;
    return { aktifHariIni, kelasTanpaJadwal, totalSlot: rows.length };
  }, [rows]);

  const perluPerhatianItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (STUB_KONFLIK_SLOT > 0) {
      items.push({
        id: "konflik-slot",
        label: `${STUB_KONFLIK_SLOT} konflik slot hari ini`,
        description: "Bentrok guru atau ruang — perlu penyelesaian.",
        tone: "danger",
        badge: "Konflik",
        actionLabel: "Selesaikan",
        actionHref: "/jadwal/daftar",
      });
    }
    if (STUB_OVERRIDE_AKTIF > 0) {
      items.push({
        id: "override-aktif",
        label: `${STUB_OVERRIDE_AKTIF} override jadwal aktif`,
        description: "Libur atau penyesuaian dekat — periksa dampak.",
        tone: "warning",
        badge: "Override",
        actionLabel: "Lihat Override",
        actionHref: "/jadwal/override",
      });
    }
    if (STUB_GURU_IZIN_DAMPAK > 0) {
      items.push({
        id: "guru-izin",
        label: `${STUB_GURU_IZIN_DAMPAK} guru izin → kelas perlu pengganti`,
        description: "Cross-menu dari Absensi Guru.",
        tone: "warning",
        badge: "Absensi",
        actionLabel: "Cari Pengganti",
        actionHref: "/jadwal/slot",
      });
    }
    return items;
  }, []);

  const jadwalHariIni = useMemo(() => {
    return rows
      .filter((s) => s.hari === HARI_INI)
      .sort((a, b) => toMinutes(a.jam_mulai ?? "00:00") - toMinutes(b.jam_mulai ?? "00:00"))
      .slice(0, 5);
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik"
        title="Dashboard Jadwal"
        description={`Ringkasan jadwal pelajaran — ${TANGGAL_HARI_INI}.`}
        actions={
          <Link to="/jadwal/daftar">
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconCalendar /></span>
              Buka Jadwal Pelajaran
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <StatCard
          label="Jadwal Aktif Hari Ini"
          value={stats.aktifHariIni}
          hint={`pada hari ${HARI_INI}`}
          icon={<IconCalendar />}
          accent="brand"
          urgency="normal"
        />
        <StatCard
          label="Konflik Slot"
          value={STUB_KONFLIK_SLOT}
          hint="bentrok guru/ruang"
          icon={<IconAlert />}
          accent="rose"
          urgency="critical"
          actionHref="/jadwal/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Override Aktif"
          value={STUB_OVERRIDE_AKTIF}
          hint="libur/penyesuaian hari ini"
          icon={<IconClock />}
          accent="amber"
          urgency="warn"
          actionHref="/jadwal/override"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Kelas Tanpa Jadwal"
          value={stats.kelasTanpaJadwal}
          hint={`tidak ada slot ${HARI_INI}`}
          icon={<IconBook />}
          accent="rose"
          urgency="critical"
          actionHref="/jadwal/slot"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Guru Izin → Kelas Terdampak"
          value={STUB_GURU_IZIN_DAMPAK}
          hint="butuh guru pengganti"
          icon={<IconUsers />}
          accent="violet"
          urgency="warn"
          actionHref="/absensi/guru"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Aksi Cepat" description="Pintasan ke sub-modul jadwal">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {QUICK_LINKS.map((qk) => (
              <Link key={qk.to} to={qk.to}
                className="block rounded-md border border-border bg-card px-3 py-2.5 transition hover:border-brand hover:bg-muted/40">
                <div className="text-sm font-medium text-fg">{qk.label}</div>
                <div className="text-xs text-muted-fg mt-0.5">{qk.description}</div>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Status Data"
          description="Hasil query Jadwal Pelajaran"
          padded={false}
        >
          <div className="px-5 py-4 text-sm">
            {q.isLoading ? (
              <span className="text-muted-fg">Memuat data jadwal...</span>
            ) : q.isError ? (
              <Badge tone="danger">Gagal memuat: {(q.error as Error).message}</Badge>
            ) : (
              <span className="text-muted-fg">{rows.length} jadwal tersedia.</span>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Jadwal Hari Ini"
          description={`5 slot terdekat — ${HARI_INI}`}
          padded={false}
          action={
            <Link to="/jadwal/daftar" className="text-xs font-medium text-brand hover:underline">
              Lihat semua
            </Link>
          }
        >
          {jadwalHariIni.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted-fg">
              {q.isLoading ? "Memuat..." : "Tidak ada slot tersisa hari ini."}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {jadwalHariIni.map((s) => (
                <li key={s.name} className="flex items-start gap-3 px-5 py-3">
                  <span className="flex w-14 shrink-0 items-center gap-1 text-xs font-semibold text-brand tabular-nums">
                    <span className="h-3 w-3"><IconClock /></span>
                    {s.jam_mulai ?? "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-fg truncate">{s.mapel ?? "—"}</div>
                    <div className="text-xs text-muted-fg truncate">
                      {(s.kelas ?? s.rombel) ?? "—"} · {s.guru ?? "—"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* TODO(/jadwal/): Wire konflik & override stubs to child `slots` + override doctype.
          Items below use stub counts until backend aggregate is available. */}
      <SectionCard title="Perlu Perhatian" description="Konflik, override, dan guru izin.">
        <AttentionList
          items={perluPerhatianItems}
          maxItems={5}
          renderLink={(href, children, className) => (
            <Link to={href} className={className}>
              {children}
            </Link>
          )}
        />
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/jadwal/")({ component: JadwalDashboardPage });
