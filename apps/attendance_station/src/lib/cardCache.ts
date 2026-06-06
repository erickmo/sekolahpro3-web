/**
 * Offline snapshot cache mapping card UIDs to their resolved subject.
 *
 * Layer: infrastructure (storage adapter). Persists a `{ uid: CardSubject }`
 * map as JSON in an injected Storage-like store, so a station can resolve a
 * scanned card to a person while offline.
 */

/** Default storage key under which the card map is persisted. */
const DEFAULT_KEY = "attendance.cards";

/** Minimal key/value store interface (localStorage-compatible subset). */
export interface KVStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** The person a physical card resolves to. */
export interface CardSubject {
  /** Doctype of the subject, e.g. "Siswa" or "Pegawai". */
  subjectType: string;
  /** Record id of the subject. */
  subjectId: string;
  /** Display name, when synced. */
  name?: string;
  /** Photo URL, when synced. */
  photo?: string;
}

/** Persisted shape: a flat map of card uid to subject. */
type CardMap = Record<string, CardSubject>;

/**
 * A card-to-subject cache backed by an injected {@link KVStore}.
 */
export class CardCache {
  private readonly store: KVStore;

  private readonly key: string;

  /**
   * @param store - the storage backend (e.g. window.localStorage).
   * @param key - storage key for the card map. Defaults to "attendance.cards".
   */
  constructor(store: KVStore, key: string = DEFAULT_KEY) {
    this.store = store;
    this.key = key;
  }

  /**
   * Read and parse the persisted card map, tolerating an empty/absent store.
   *
   * @returns the parsed card map, or an empty map when nothing is stored.
   */
  private read(): CardMap {
    const raw = this.store.getItem(this.key);
    if (!raw) {
      return {};
    }
    // Degrade a corrupt/blank blob to an empty map so offline reads never throw.
    try {
      return JSON.parse(raw) as CardMap;
    } catch {
      return {};
    }
  }

  /**
   * Upsert a card uid -> subject mapping and persist it.
   *
   * @param uid - the card's unique id.
   * @param subject - the subject the card resolves to.
   */
  put(uid: string, subject: CardSubject): void {
    const map = this.read();
    map[uid] = subject;
    this.store.setItem(this.key, JSON.stringify(map));
  }

  /**
   * Look up the subject for a card uid.
   *
   * @param uid - the card's unique id.
   * @returns the cached subject, or null on a miss.
   */
  get(uid: string): CardSubject | null {
    return this.read()[uid] ?? null;
  }
}
