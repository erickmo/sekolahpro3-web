import { createFileRoute } from "@tanstack/react-router";
import { useResourceDoc } from "@sekolahpro/api-client";
import { DomainDetailScaffold } from "../components/shared/DomainDetailScaffold";

interface SlotJadwalDoc {
  name: string;
  hari?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  durasi_menit?: number;
  tipe?: string;
  creation?: string;
  modified?: string;
}

function SlotJadwalDetailPage() {
  const { name } = Route.useParams();
  const q = useResourceDoc<SlotJadwalDoc>("Slot Jadwal", name);
  const d = q.data;

  return (
    <DomainDetailScaffold
      eyebrow="Slot Jadwal"
      domain={{ label: "Jadwal", to: "/$sekolah/jadwal" }}
      crumbParent={{ label: "Slot Jadwal", to: "/$sekolah/jadwal/slot" }}
      crumbSelf={name}
      title={d?.hari ? `${d.hari} · ${d.jam_mulai ?? ""}–${d.jam_selesai ?? ""}` : name}
      description={d?.tipe ? `Tipe: ${d.tipe}` : undefined}
      backTo="/$sekolah/jadwal/slot"
      loading={q.isLoading}
      errorMessage={q.isError ? (q.error as Error).message : undefined}
      primaryInfo={[
        { label: "ID", value: <span className="font-mono text-xs">{name}</span> },
        { label: "Hari", value: d?.hari ?? "—" },
        { label: "Tipe", value: d?.tipe ?? "—" },
        { label: "Jam Mulai", value: d?.jam_mulai ?? "—" },
        { label: "Jam Selesai", value: d?.jam_selesai ?? "—" },
        { label: "Durasi", value: d?.durasi_menit ? `${d.durasi_menit} menit` : "—" },
      ]}
      secondaryInfo={[
        { label: "Dibuat", value: d?.creation ?? "—" },
        { label: "Diubah", value: d?.modified ?? "—" },
      ]}
    />
  );
}

export const Route = createFileRoute("/$sekolah/jadwal/slot/$name")({ component: SlotJadwalDetailPage });
