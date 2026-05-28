import type { PickupPerson, PickupEvent } from "../pickup-types";

export const mockPickupPersons: Record<string, PickupPerson[]> = {
  "1001": [
    {
      id: "pp-self-1001",
      nis: "1001",
      nama: "Saya (Orang Tua)",
      hubungan: "Orang Tua",
      phone: "+6281234567890",
      photoUrl: null,
      isActive: true,
      createdBy: "parent@example.com",
    },
    {
      id: "pp-1001-driver",
      nis: "1001",
      nama: "Pak Budi (Driver)",
      hubungan: "Driver",
      phone: "+6285600001111",
      photoUrl: null,
      isActive: true,
      createdBy: "parent@example.com",
    },
  ],
  "1002": [
    {
      id: "pp-self-1002",
      nis: "1002",
      nama: "Saya (Orang Tua)",
      hubungan: "Orang Tua",
      phone: "+6281234567890",
      photoUrl: null,
      isActive: true,
      createdBy: "parent@example.com",
    },
  ],
};

export const mockPickupEvents: PickupEvent[] = [
  {
    id: "ev-1",
    nis: "1001",
    pickupPersonId: "pp-1001-driver",
    pickupPersonNama: "Pak Budi (Driver)",
    pickupPersonHubungan: "Driver",
    method: "qr",
    status: "completed",
    requestedAt: "2026-05-28T07:25:00Z",
    confirmedAt: "2026-05-28T07:25:05Z",
    completedAt: "2026-05-28T07:26:00Z",
    verifiedBy: "satpam01",
    gate: "Gerbang Utama",
    note: null,
  },
];

export function mockIssueToken(nis: string, personId: string): { token: string; expIso: string } {
  const now = Date.now();
  const exp = new Date(now + 30_000).toISOString();
  const fake = btoa(`${nis}.${personId}.${now}`).replace(/=/g, "");
  return { token: `mock.${fake}`, expIso: exp };
}
