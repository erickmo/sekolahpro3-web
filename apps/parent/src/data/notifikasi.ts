export type NotifikasiTone = "info" | "warning" | "success";

export interface NotifikasiItem {
  id: string;
  title: string;
  body: string;
  ago: string;
  tone: NotifikasiTone;
  read: boolean;
}

export const notifikasiOrangTua: NotifikasiItem[] = [
  { id: "n1", title: "Tagihan SPP jatuh tempo", body: "Andi — SPP Mei jatuh tempo 30 Mei.", ago: "1 hari lalu", tone: "warning", read: false },
  { id: "n2", title: "Nilai Matematika diumumkan", body: "Andi: 92 (A).", ago: "2 hari lalu", tone: "success", read: false },
  { id: "n3", title: "Rapat orang tua", body: "Sabtu 09:00 di aula.", ago: "3 hari lalu", tone: "info", read: true },
];
