export interface CardToken {
  kartu_id: string;
  nonce: string;
  exp: number;
  hmac: string;
  raw: string;
}

export type CardReaderErrorCode =
  | "UNSUPPORTED"
  | "PERMISSION_DENIED"
  | "READ_FAILED"
  | "PARSE_FAILED"
  | "TIMEOUT"
  | "ABORTED";

export class CardReaderError extends Error {
  readonly code: CardReaderErrorCode;
  constructor(code: CardReaderErrorCode, message?: string) {
    super(message ?? code);
    this.name = "CardReaderError";
    this.code = code;
  }
}
