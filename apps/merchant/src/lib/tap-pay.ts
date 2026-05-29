import { ChargeError, type ChargeInput, type ChargeResult } from "./merchant-api";
import { ChargeErrorCode } from "./error-codes";

interface ApiPort {
  charge(input: ChargeInput): Promise<ChargeResult>;
}
interface IdempotencyPort {
  next(): string;
}

interface Deps {
  api: ApiPort;
  idempotency: IdempotencyPort;
  input: Omit<ChargeInput, "idempotency_key">;
  maxRetries?: number;
  retryDelayMs?: number;
}

export type TapPayResult =
  | { kind: "ok"; receipt: ChargeResult }
  | { kind: "error"; code: ChargeErrorCode };

const RETRYABLE: ReadonlySet<ChargeErrorCode> = new Set([
  ChargeErrorCode.NETWORK,
]);

export async function tapPay({
  api,
  idempotency,
  input,
  maxRetries = 3,
  retryDelayMs = 250,
}: Deps): Promise<TapPayResult> {
  const idempotency_key = idempotency.next();
  let attempt = 0;
  while (true) {
    try {
      const receipt = await api.charge({ ...input, idempotency_key });
      return { kind: "ok", receipt };
    } catch (e) {
      if (e instanceof ChargeError) {
        if (RETRYABLE.has(e.code) && attempt < maxRetries) {
          attempt += 1;
          await new Promise((r) => setTimeout(r, retryDelayMs));
          continue;
        }
        return { kind: "error", code: e.code };
      }
      return { kind: "error", code: ChargeErrorCode.UNKNOWN };
    }
  }
}
