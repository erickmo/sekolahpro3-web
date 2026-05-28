export type PickupHubungan =
  | "Wali"
  | "Orang Tua"
  | "Kakek-Nenek"
  | "Driver"
  | "Lainnya";

export type PickupEventStatus =
  | "pending"
  | "approved"
  | "declined"
  | "completed"
  | "expired";

export interface PickupPersonSummary {
  id: string;
  nis: string;
  nama: string;
  hubungan: PickupHubungan;
  phone: string;
  photoUrl: string | null;
}

export interface ChildSummaryForStaff {
  nis: string;
  nama: string;
  kelas: string;
  photoUrl: string | null;
}

export interface PickupEvent {
  id: string;
  nis: string;
  childNama: string;
  childKelas: string;
  childPhotoUrl: string | null;
  pickupPersonId: string;
  pickupPersonNama: string;
  pickupPersonHubungan: PickupHubungan;
  pickupPersonPhotoUrl: string | null;
  pickupPersonPhone: string;
  method: "qr" | "pin";
  status: PickupEventStatus;
  requestedAt: string;
  gate: string | null;
  note: string | null;
}

export interface PickupError {
  errorCode: string;
  message: string;
}
