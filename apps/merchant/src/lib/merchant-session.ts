import { useSession } from "@sekolahpro/auth";

export interface MerchantClaims {
  merchant_id: string;
  terminal_id: string;
  operator_user?: string;
  void_window_minutes: number;
}

export interface MerchantContext {
  merchantId: string;
  terminalId: string;
  operatorUser?: string;
  voidWindowMinutes: number;
}

export function getMerchantContext(claims: MerchantClaims): MerchantContext {
  if (!claims?.merchant_id) throw new Error("missing merchant_id in claims");
  if (!claims?.terminal_id) throw new Error("missing terminal_id in claims");
  return {
    merchantId: claims.merchant_id,
    terminalId: claims.terminal_id,
    ...(claims.operator_user ? { operatorUser: claims.operator_user } : {}),
    voidWindowMinutes: claims.void_window_minutes ?? 10,
  };
}

/**
 * Adapter over @sekolahpro/auth's `useSession()`.
 *
 * Note: the shared SessionState shape does not yet carry merchant JWT claims;
 * we read them from an optional `claims` field that the merchant backend is
 * expected to attach to the session state (see Task 9 MSW handlers). When the
 * real auth flow lands, this is the single seam to update.
 */
export function useMerchantContext(): MerchantContext {
  const session = useSession() as unknown as { claims?: MerchantClaims };
  if (!session?.claims) {
    throw new Error("session has no merchant claims");
  }
  return getMerchantContext(session.claims);
}
