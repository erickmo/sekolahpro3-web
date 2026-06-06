// ABS-002
import { describe, expect, it } from "vitest";

import { CardCache, type CardSubject, type KVStore } from "../cardCache";

/** In-memory KVStore shim mirroring localStorage's get/set surface. */
function makeStore(): KVStore {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

const UID = "04A1B2C3";
const SUBJECT: CardSubject = {
  subjectType: "Siswa",
  subjectId: "SISWA-1",
  name: "Budi",
};

describe("CardCache", () => {
  it("returns a subject after it is put", () => {
    // ABS-002 | round-trip through the store
    const cache = new CardCache(makeStore());
    cache.put(UID, SUBJECT);
    expect(cache.get(UID)).toEqual(SUBJECT);
  });

  it("returns null for an unknown uid", () => {
    // ABS-002 | cache miss
    const cache = new CardCache(makeStore());
    expect(cache.get("UNKNOWN")).toBeNull();
  });

  it("survives a fresh cache over the same store", () => {
    // ABS-002 | persistence: a new CardCache reads what the old one wrote
    const store = makeStore();
    new CardCache(store).put(UID, SUBJECT);
    const reloaded = new CardCache(store);
    expect(reloaded.get(UID)).toEqual(SUBJECT);
  });
});
