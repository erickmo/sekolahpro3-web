export type PickupHubungan =
  | "Wali"
  | "Orang Tua"
  | "Kakek-Nenek"
  | "Driver"
  | "Lainnya";

export interface PickupPerson {
  id: string;
  nis: string;
  nama: string;
  hubungan: PickupHubungan;
  phone: string;
  photoUrl: string | null;
  isActive: boolean;
  createdBy: string;
}

export type PickupMethod = "qr" | "pin";
export type PickupEventStatus =
  | "pending"
  | "approved"
  | "declined"
  | "completed"
  | "expired";

export interface PickupEvent {
  id: string;
  nis: string;
  pickupPersonId: string;
  pickupPersonNama: string;
  pickupPersonHubungan: PickupHubungan;
  method: PickupMethod;
  status: PickupEventStatus;
  requestedAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  verifiedBy: string | null;
  gate: string | null;
  note: string | null;
}

export interface IssuedToken {
  token: string;
  expIso: string;
}
