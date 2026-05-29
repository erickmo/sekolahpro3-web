import { useMutation, useQuery } from "@tanstack/react-query";
import { frappeFetch, useFrappeMethod } from "@sekolahpro/api-client";
import type {
  PickupEvent,
  PickupError,
  PickupPersonSummary,
  PickupHubungan,
  PickupEventStatus,
} from "./pickup-types";
import {
  mockScanToken,
  mockVerifyPin,
  mockListPersonsForNis,
} from "./mock/pickup";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

const M = {
  scan: "sekolahpro.api.pickup.staff_scan_token",
  verify: "sekolahpro.api.pickup.staff_verify_pin",
  complete: "sekolahpro.api.pickup.staff_complete_pickup",
  decline: "sekolahpro.api.pickup.staff_decline_pickup",
  watch: "sekolahpro.api.pickup.staff_watch_event",
  listPersons: "sekolahpro.api.pickup.staff_list_persons_for_nis",
};

interface WireEvent {
  id: string;
  nis: string;
  child_nama: string;
  child_kelas: string;
  child_photo_url: string | null;
  pickup_person_id: string;
  pickup_person_nama: string;
  pickup_person_hubungan: PickupHubungan;
  pickup_person_photo_url: string | null;
  pickup_person_phone: string;
  method: "qr" | "pin";
  status: PickupEventStatus;
  requested_at: string;
  gate: string | null;
  note: string | null;
}

function fromWireEvent(w: WireEvent): PickupEvent {
  return {
    id: w.id,
    nis: w.nis,
    childNama: w.child_nama,
    childKelas: w.child_kelas,
    childPhotoUrl: w.child_photo_url,
    pickupPersonId: w.pickup_person_id,
    pickupPersonNama: w.pickup_person_nama,
    pickupPersonHubungan: w.pickup_person_hubungan,
    pickupPersonPhotoUrl: w.pickup_person_photo_url,
    pickupPersonPhone: w.pickup_person_phone,
    method: w.method,
    status: w.status,
    requestedAt: w.requested_at,
    gate: w.gate,
    note: w.note,
  };
}

function isError(x: PickupEvent | PickupError): x is PickupError {
  return (x as PickupError).errorCode !== undefined;
}

export function useStaffScanToken() {
  return useMutation<PickupEvent, PickupError, { token: string; gate: string | null }>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const r = mockScanToken(input.token, input.gate);
        if (isError(r)) throw r;
        return r;
      }
      try {
        const raw = await frappeFetch<WireEvent>(M.scan, { token: input.token, gate: input.gate });
        return fromWireEvent(raw);
      } catch (e) {
        throw { errorCode: "unknown", message: (e as Error).message } satisfies PickupError;
      }
    },
  });
}

export function useStaffListPersonsForNis(nis: string | null) {
  const real = useFrappeMethod<PickupPersonSummary[]>(
    M.listPersons,
    { nis },
    { enabled: !USE_MOCKS && !!nis },
  );
  const mock = useQuery<PickupPersonSummary[]>({
    queryKey: [M.listPersons, { nis }, "mock"],
    queryFn: async () => (nis ? mockListPersonsForNis(nis) : []),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  return USE_MOCKS ? mock : real;
}

export function useStaffVerifyPin() {
  return useMutation<
    PickupEvent,
    PickupError,
    { nis: string; pickupPersonId: string; pin: string; gate: string | null }
  >({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const r = mockVerifyPin(input.nis, input.pickupPersonId, input.pin, input.gate);
        if (isError(r)) throw r;
        return r;
      }
      try {
        const raw = await frappeFetch<WireEvent>(M.verify, {
          nis: input.nis,
          pickup_person_id: input.pickupPersonId,
          pin: input.pin,
          gate: input.gate,
        });
        return fromWireEvent(raw);
      } catch (e) {
        throw { errorCode: "unknown", message: (e as Error).message } satisfies PickupError;
      }
    },
  });
}

export function useStaffCompletePickup() {
  return useMutation<PickupEvent, PickupError, { eventId: string; note?: string }>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        return {
          id: input.eventId,
          nis: "1001",
          childNama: "Andi Pratama",
          childKelas: "XI IPA 2",
          childPhotoUrl: null,
          pickupPersonId: "pp-1001-driver",
          pickupPersonNama: "Pak Budi (Driver)",
          pickupPersonHubungan: "Driver",
          pickupPersonPhotoUrl: null,
          pickupPersonPhone: "+6285600001111",
          method: "qr",
          status: "completed",
          requestedAt: new Date().toISOString(),
          gate: null,
          note: input.note ?? null,
        };
      }
      const raw = await frappeFetch<WireEvent>(M.complete, { event_id: input.eventId, note: input.note });
      return fromWireEvent(raw);
    },
  });
}

export function useStaffDeclinePickup() {
  return useMutation<PickupEvent, PickupError, { eventId: string; note: string }>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        return {
          id: input.eventId,
          nis: "1001",
          childNama: "Andi Pratama",
          childKelas: "XI IPA 2",
          childPhotoUrl: null,
          pickupPersonId: "pp-1001-driver",
          pickupPersonNama: "Pak Budi (Driver)",
          pickupPersonHubungan: "Driver",
          pickupPersonPhotoUrl: null,
          pickupPersonPhone: "+6285600001111",
          method: "qr",
          status: "declined",
          requestedAt: new Date().toISOString(),
          gate: null,
          note: input.note,
        };
      }
      const raw = await frappeFetch<WireEvent>(M.decline, { event_id: input.eventId, note: input.note });
      return fromWireEvent(raw);
    },
  });
}

export function useStaffWatchEvent(eventId: string | null) {
  const real = useFrappeMethod<WireEvent>(
    M.watch,
    { event_id: eventId },
    { enabled: !USE_MOCKS && !!eventId, refetchInterval: 2000 },
  );
  const mock = useQuery<PickupEvent | null>({
    queryKey: [M.watch, { eventId }, "mock"],
    queryFn: async () => null,
    enabled: USE_MOCKS && !!eventId,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data ? fromWireEvent(real.data) : undefined } as unknown as typeof mock;
}
