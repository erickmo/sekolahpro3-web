// jadwalPapan — pure helpers for the Papan Susun editable grid. No React, no I/O.
//
// Slot Jadwal is a child table of Jadwal Pelajaran; editing means sending the
// FULL slots array back on the parent PUT. These helpers shape that payload and
// derive the grid/worklist so the route stays declarative and the logic stays
// unit-tested.

/** A weekly slot as loaded from / written to the Jadwal Pelajaran doc. */
export interface PapanSlot {
  name?: string; // child docname (present for existing rows; absent for new)
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  mata_pelajaran?: string | null;
  guru?: string | null;
  ruangan?: string | null;
  tipe?: string;
}

const TIPE_DEFAULT = "Reguler";

/** Stable key for a time band (jam_mulai..jam_selesai). */
export function bandKey(s: { jam_mulai: string; jam_selesai: string }): string {
  return `${s.jam_mulai}|${s.jam_selesai}`;
}

/** Distinct time bands across the slots, sorted by start time. */
export function bandsFromSlots(slots: readonly PapanSlot[]): { jam_mulai: string; jam_selesai: string }[] {
  const seen = new Map<string, { jam_mulai: string; jam_selesai: string }>();
  for (const s of slots) seen.set(bandKey(s), { jam_mulai: s.jam_mulai, jam_selesai: s.jam_selesai });
  return [...seen.values()].sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
}

/** Count of slots still missing a teacher (the publish blocker). */
export function slotsTanpaGuru(slots: readonly PapanSlot[]): number {
  return slots.filter((s) => !s.guru).length;
}

/** True when the schedule may be submitted (has slots, none missing a teacher). */
export function bolehTerbitkan(slots: readonly PapanSlot[]): boolean {
  return slots.length > 0 && slotsTanpaGuru(slots) === 0;
}

/**
 * Shape the slots array for the parent PUT: keep existing child docnames so
 * Frappe updates in place rather than recreating, and default the tipe.
 */
export function toSlotsPayload(slots: readonly PapanSlot[]): Record<string, unknown>[] {
  return slots.map((s) => ({
    ...(s.name ? { name: s.name } : {}),
    hari: s.hari,
    jam_mulai: s.jam_mulai,
    jam_selesai: s.jam_selesai,
    mata_pelajaran: s.mata_pelajaran ?? null,
    guru: s.guru ?? null,
    ruangan: s.ruangan ?? null,
    tipe: s.tipe ?? TIPE_DEFAULT,
  }));
}

/** Append a new slot and return the payload array for the PUT. */
export function withTambahanSlot(slots: readonly PapanSlot[], baru: PapanSlot): Record<string, unknown>[] {
  return toSlotsPayload([...slots, baru]);
}

/** Remove the slot at `index` and return the payload array for the PUT. */
export function tanpaSlot(slots: readonly PapanSlot[], index: number): Record<string, unknown>[] {
  return toSlotsPayload(slots.filter((_, i) => i !== index));
}
