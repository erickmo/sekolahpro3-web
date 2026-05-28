import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  PageHeader,
  SectionCard,
  Tabs,
  type TabItem,
} from "@sekolahpro/ui";

type SlotKind = "pelajaran" | "istirahat" | "ekskul";
type Slot = {
  time: string;
  endTime: string;
  subject: string;
  teacher?: string;
  room?: string;
  kind?: SlotKind;
};

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;
type Hari = (typeof HARI)[number];

const JADWAL: Record<Hari, Slot[]> = {
  Senin: [
    { time: "07:00", endTime: "07:30", subject: "Upacara", kind: "ekskul" },
    { time: "07:30", endTime: "09:00", subject: "Matematika", teacher: "Bu Siti", room: "R. 204" },
    { time: "09:00", endTime: "10:30", subject: "Bahasa Inggris", teacher: "Pak Joko", room: "R. 101" },
    { time: "10:30", endTime: "11:00", subject: "Istirahat", kind: "istirahat" },
    { time: "11:00", endTime: "12:30", subject: "Fisika", teacher: "Pak Andi", room: "Lab Fisika" },
    { time: "13:00", endTime: "14:30", subject: "Sejarah", teacher: "Bu Rina", room: "R. 305" },
  ],
  Selasa: [
    { time: "07:00", endTime: "08:30", subject: "Kimia", teacher: "Bu Lina", room: "Lab Kimia" },
    { time: "08:30", endTime: "10:00", subject: "Bahasa Indonesia", teacher: "Pak Bambang", room: "R. 204" },
    { time: "10:00", endTime: "10:30", subject: "Istirahat", kind: "istirahat" },
    { time: "10:30", endTime: "12:00", subject: "Biologi", teacher: "Bu Tika", room: "Lab Biologi" },
    { time: "13:00", endTime: "14:30", subject: "PJOK", teacher: "Pak Eko", room: "Lapangan" },
  ],
  Rabu: [
    { time: "07:00", endTime: "08:30", subject: "Matematika", teacher: "Bu Siti", room: "R. 204" },
    { time: "08:30", endTime: "10:00", subject: "PKn", teacher: "Pak Hadi", room: "R. 305" },
    { time: "10:00", endTime: "10:30", subject: "Istirahat", kind: "istirahat" },
    { time: "10:30", endTime: "12:00", subject: "Fisika", teacher: "Pak Andi", room: "Lab Fisika" },
    { time: "13:00", endTime: "14:30", subject: "Seni Budaya", teacher: "Bu Mira", room: "R. 102" },
  ],
  Kamis: [
    { time: "07:00", endTime: "08:30", subject: "Bahasa Inggris", teacher: "Pak Joko", room: "R. 101" },
    { time: "08:30", endTime: "10:00", subject: "Sejarah", teacher: "Bu Rina", room: "R. 305" },
    { time: "10:00", endTime: "10:30", subject: "Istirahat", kind: "istirahat" },
    { time: "10:30", endTime: "12:00", subject: "Matematika", teacher: "Bu Siti", room: "R. 204" },
    { time: "13:00", endTime: "14:30", subject: "Ekonomi", teacher: "Pak Yusuf", room: "R. 203" },
  ],
  Jumat: [
    { time: "07:00", endTime: "08:00", subject: "Agama", teacher: "Pak Imam", room: "R. 102" },
    { time: "08:00", endTime: "09:30", subject: "Bahasa Indonesia", teacher: "Pak Bambang", room: "R. 204" },
    { time: "09:30", endTime: "10:00", subject: "Istirahat", kind: "istirahat" },
    { time: "10:00", endTime: "11:30", subject: "Kimia", teacher: "Bu Lina", room: "Lab Kimia" },
    { time: "14:00", endTime: "15:30", subject: "Pramuka", kind: "ekskul" },
  ],
};

const TODAY_INDEX = 0;

function SlotRow({ slot }: { slot: Slot }) {
  const isBreak = slot.kind === "istirahat";
  const isExtra = slot.kind === "ekskul";
  return (
    <li
      className={`flex items-stretch gap-4 px-5 py-3.5 ${
        isBreak ? "bg-muted/40" : ""
      }`}
    >
      <div className="w-20 shrink-0">
        <div className="text-sm font-semibold text-brand tabular-nums">
          {slot.time}
        </div>
        <div className="text-[11px] text-muted-fg tabular-nums">
          s/d {slot.endTime}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-fg truncate">
          {slot.subject}
        </div>
        {slot.teacher ? (
          <div className="text-xs text-muted-fg truncate">
            {slot.teacher}
            {slot.room ? ` · ${slot.room}` : ""}
          </div>
        ) : (
          <div className="text-xs text-muted-fg italic">
            {isBreak ? "Waktu istirahat" : isExtra ? "Kegiatan sekolah" : ""}
          </div>
        )}
      </div>
      {slot.room && !isBreak ? (
        <Badge tone={isExtra ? "warning" : "neutral"}>{slot.room}</Badge>
      ) : null}
    </li>
  );
}

function JadwalPage() {
  const [hari, setHari] = useState<Hari>(HARI[TODAY_INDEX]);
  const slots = JADWAL[hari];
  const total = slots.filter((s) => !s.kind || s.kind === "pelajaran").length;

  const tabs: TabItem[] = HARI.map((h) => ({
    key: h,
    label: h,
    active: hari === h,
    count: JADWAL[h].filter((s) => !s.kind || s.kind === "pelajaran").length,
    render: ({ className, children }) => (
      <button
        type="button"
        onClick={() => setHari(h)}
        className={className}
      >
        {children}
      </button>
    ),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Akademik"
        title="Jadwal Pelajaran"
        description="Jadwal mingguan kelas XI IPA 2 · Semester Ganjil 2026/2027."
      />
      <Tabs items={tabs} />
      <SectionCard
        title={`${hari}`}
        description={`${total} mata pelajaran`}
        padded={false}
      >
        <ul className="divide-y divide-border">
          {slots.map((s) => (
            <SlotRow key={`${hari}-${s.time}`} slot={s} />
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/jadwal")({ component: JadwalPage });
