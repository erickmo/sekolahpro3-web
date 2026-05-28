import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFrappeMethod, frappeFetch } from "@sekolahpro/api-client";
import type {
  PickupPerson,
  PickupEvent,
  IssuedToken,
  PickupHubungan,
} from "./pickup-types";
import {
  mockPickupPersons,
  mockPickupEvents,
  mockIssueToken,
} from "./mock/pickup";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

const M = {
  list: "sekolahpro.api.pickup.list_pickup_persons",
  create: "sekolahpro.api.pickup.create_pickup_person",
  update: "sekolahpro.api.pickup.update_pickup_person",
  revoke: "sekolahpro.api.pickup.revoke_pickup_person",
  issue: "sekolahpro.api.pickup.issue_pickup_token",
  events: "sekolahpro.api.pickup.list_pickup_events",
  respond: "sekolahpro.api.pickup.parent_respond_pickup",
};

interface WirePickupPerson {
  id: string;
  nis: string;
  nama: string;
  hubungan: PickupHubungan;
  phone: string;
  photo_url: string | null;
  is_active: boolean;
  created_by: string;
}

function fromWirePerson(w: WirePickupPerson): PickupPerson {
  return {
    id: w.id,
    nis: w.nis,
    nama: w.nama,
    hubungan: w.hubungan,
    phone: w.phone,
    photoUrl: w.photo_url,
    isActive: w.is_active,
    createdBy: w.created_by,
  };
}

interface WirePickupEvent {
  id: string;
  nis: string;
  pickup_person_id: string;
  pickup_person_nama: string;
  pickup_person_hubungan: PickupHubungan;
  method: "qr" | "pin";
  status: "pending" | "approved" | "declined" | "completed" | "expired";
  requested_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  verified_by: string | null;
  gate: string | null;
  note: string | null;
}

function fromWireEvent(w: WirePickupEvent): PickupEvent {
  return {
    id: w.id,
    nis: w.nis,
    pickupPersonId: w.pickup_person_id,
    pickupPersonNama: w.pickup_person_nama,
    pickupPersonHubungan: w.pickup_person_hubungan,
    method: w.method,
    status: w.status,
    requestedAt: w.requested_at,
    confirmedAt: w.confirmed_at,
    completedAt: w.completed_at,
    verifiedBy: w.verified_by,
    gate: w.gate,
    note: w.note,
  };
}

export function useListPickupPersons(nis: string | null) {
  const real = useFrappeMethod<WirePickupPerson[]>(
    M.list,
    { nis },
    { enabled: !USE_MOCKS && !!nis },
  );
  const mock = useQuery<PickupPerson[]>({
    queryKey: [M.list, { nis }, "mock"],
    queryFn: async () => (nis ? mockPickupPersons[nis] ?? [] : []),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data?.map(fromWirePerson) } as unknown as typeof mock;
}

export interface CreatePickupPersonInput {
  nis: string;
  nama: string;
  hubungan: PickupHubungan;
  phone: string;
  photoUrl?: string | null;
  pin: string;
}

export function useCreatePickupPerson() {
  const qc = useQueryClient();
  return useMutation<PickupPerson, Error, CreatePickupPersonInput>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const newP: PickupPerson = {
          id: `pp-${Date.now()}`,
          nis: input.nis,
          nama: input.nama,
          hubungan: input.hubungan,
          phone: input.phone,
          photoUrl: input.photoUrl ?? null,
          isActive: true,
          createdBy: "mock-parent",
        };
        const list = mockPickupPersons[input.nis] ?? [];
        mockPickupPersons[input.nis] = [...list, newP];
        return newP;
      }
      const raw = await frappeFetch<WirePickupPerson>(M.create, {
        nis: input.nis,
        nama: input.nama,
        hubungan: input.hubungan,
        phone: input.phone,
        photo_url: input.photoUrl ?? null,
        pin: input.pin,
      });
      return fromWirePerson(raw);
    },
    onSuccess: (_p, vars) => {
      qc.invalidateQueries({ queryKey: [M.list, { nis: vars.nis }] });
    },
  });
}

export interface UpdatePickupPersonInput {
  id: string;
  nis: string;
  nama?: string;
  hubungan?: PickupHubungan;
  phone?: string;
  photoUrl?: string | null;
  pin?: string;
}

export function useUpdatePickupPerson() {
  const qc = useQueryClient();
  return useMutation<PickupPerson, Error, UpdatePickupPersonInput>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const list = mockPickupPersons[input.nis] ?? [];
        const idx = list.findIndex((p) => p.id === input.id);
        if (idx < 0) throw new Error("not_found");
        const merged: PickupPerson = {
          ...list[idx]!,
          nama: input.nama ?? list[idx]!.nama,
          hubungan: input.hubungan ?? list[idx]!.hubungan,
          phone: input.phone ?? list[idx]!.phone,
          photoUrl: input.photoUrl ?? list[idx]!.photoUrl,
        };
        list[idx] = merged;
        mockPickupPersons[input.nis] = [...list];
        return merged;
      }
      const raw = await frappeFetch<WirePickupPerson>(M.update, {
        id: input.id,
        nama: input.nama,
        hubungan: input.hubungan,
        phone: input.phone,
        photo_url: input.photoUrl,
        pin: input.pin,
      });
      return fromWirePerson(raw);
    },
    onSuccess: (_p, vars) => {
      qc.invalidateQueries({ queryKey: [M.list, { nis: vars.nis }] });
    },
  });
}

export function useRevokePickupPerson() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, Error, { id: string; nis: string }>({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const list = mockPickupPersons[input.nis] ?? [];
        mockPickupPersons[input.nis] = list.map((p) =>
          p.id === input.id ? { ...p, isActive: false } : p,
        );
        return { ok: true };
      }
      return frappeFetch<{ ok: true }>(M.revoke, { id: input.id });
    },
    onSuccess: (_o, vars) => {
      qc.invalidateQueries({ queryKey: [M.list, { nis: vars.nis }] });
    },
  });
}

export function useIssuePickupToken() {
  return useMutation<IssuedToken, Error, { nis: string; pickupPersonId: string }>({
    mutationFn: async (input) => {
      if (USE_MOCKS) return mockIssueToken(input.nis, input.pickupPersonId);
      const raw = await frappeFetch<{ token: string; exp_iso: string }>(
        M.issue,
        { nis: input.nis, pickup_person_id: input.pickupPersonId },
      );
      return { token: raw.token, expIso: raw.exp_iso };
    },
  });
}

export function useListPickupEvents(nis: string | null, sinceIso?: string) {
  const real = useFrappeMethod<WirePickupEvent[]>(
    M.events,
    { nis, since_iso: sinceIso },
    { enabled: !USE_MOCKS && !!nis, refetchInterval: 3000 },
  );
  const mock = useQuery<PickupEvent[]>({
    queryKey: [M.events, { nis, sinceIso }, "mock"],
    queryFn: async () =>
      nis ? mockPickupEvents.filter((e) => e.nis === nis) : [],
    enabled: USE_MOCKS && !!nis,
    refetchInterval: USE_MOCKS ? 3000 : false,
    staleTime: 0,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data?.map(fromWireEvent) } as unknown as typeof mock;
}

export function useParentRespondPickup() {
  const qc = useQueryClient();
  return useMutation<
    PickupEvent,
    Error,
    { eventId: string; nis: string; decision: "approve" | "decline" }
  >({
    mutationFn: async (input) => {
      if (USE_MOCKS) {
        const idx = mockPickupEvents.findIndex((e) => e.id === input.eventId);
        if (idx < 0) throw new Error("not_found");
        const next: PickupEvent = {
          ...mockPickupEvents[idx]!,
          status: input.decision === "approve" ? "approved" : "declined",
          confirmedAt: new Date().toISOString(),
        };
        mockPickupEvents[idx] = next;
        return next;
      }
      const raw = await frappeFetch<WirePickupEvent>(M.respond, {
        event_id: input.eventId,
        decision: input.decision,
      });
      return fromWireEvent(raw);
    },
    onSuccess: (_e, vars) => {
      qc.invalidateQueries({ queryKey: [M.events, { nis: vars.nis }] });
    },
  });
}
