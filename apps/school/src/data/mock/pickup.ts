import type { PickupEvent, PickupPersonSummary, PickupError } from "../pickup-types";

const childPhoto = null;

export function mockScanToken(token: string, gate: string | null): PickupEvent | PickupError {
  if (!token.startsWith("mock.")) return { errorCode: "token_invalid", message: "Token tidak valid" };
  return {
    id: `ev-${Date.now()}`,
    nis: "1001",
    childNama: "Andi Pratama",
    childKelas: "XI IPA 2",
    childPhotoUrl: childPhoto,
    pickupPersonId: "pp-1001-driver",
    pickupPersonNama: "Pak Budi (Driver)",
    pickupPersonHubungan: "Driver",
    pickupPersonPhotoUrl: null,
    pickupPersonPhone: "+6285600001111",
    method: "qr",
    status: "approved",
    requestedAt: new Date().toISOString(),
    gate,
    note: null,
  };
}

export function mockListPersonsForNis(nis: string): PickupPersonSummary[] {
  if (nis !== "1001") return [];
  return [
    { id: "pp-1001-driver", nis: "1001", nama: "Pak Budi (Driver)", hubungan: "Driver", phone: "+6285600001111", photoUrl: null },
    { id: "pp-self-1001", nis: "1001", nama: "Bpk Ahmad", hubungan: "Orang Tua", phone: "+6281234567890", photoUrl: null },
  ];
}

export function mockVerifyPin(
  nis: string,
  pickupPersonId: string,
  pin: string,
  gate: string | null,
): PickupEvent | PickupError {
  if (nis !== "1001" || pickupPersonId !== "pp-1001-driver") {
    return { errorCode: "person_not_found", message: "Penjemput tidak ditemukan" };
  }
  if (pin !== "479216") return { errorCode: "pin_invalid", message: "PIN salah" };
  return {
    id: `ev-${Date.now()}`,
    nis,
    childNama: "Andi Pratama",
    childKelas: "XI IPA 2",
    childPhotoUrl: childPhoto,
    pickupPersonId,
    pickupPersonNama: "Pak Budi (Driver)",
    pickupPersonHubungan: "Driver",
    pickupPersonPhotoUrl: null,
    pickupPersonPhone: "+6285600001111",
    method: "pin",
    status: "approved",
    requestedAt: new Date().toISOString(),
    gate,
    note: null,
  };
}
