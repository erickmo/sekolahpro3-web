/**
 * Minimal pure-JS ZIP writer (STORE / no compression) for bundling the reports
 * of a Susun & Kirim packet into one downloadable archive (graft C2) — without a
 * runtime dependency (jszip). Report files (xlsx already compressed, json/csv
 * text) bundle fine uncompressed. Produces a standards-valid ZIP.
 */

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
const VERSION = 20;
const DOS_DATE = 0x21; // 1980-01-01 — a valid placeholder mod date

let TABLE: Uint32Array | null = null;
function crcTable(): Uint32Array {
  if (TABLE) return TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  TABLE = t;
  return t;
}

/** CRC-32 (IEEE) of a byte array. */
export function crc32(bytes: Uint8Array): number {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = (t[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipFile {
  name: string;
  bytes: Uint8Array;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Build a valid (uncompressed) ZIP archive from the given files. */
export function buildStoredZip(files: readonly ZipFile[]): Uint8Array {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = encoder.encode(f.name);
    const crc = crc32(f.bytes);
    const size = f.bytes.length;

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, LOCAL_SIG, true);
    lh.setUint16(4, VERSION, true);
    lh.setUint16(6, 0, true);
    lh.setUint16(8, 0, true); // method 0 = stored
    lh.setUint16(10, 0, true);
    lh.setUint16(12, DOS_DATE, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, size, true);
    lh.setUint32(22, size, true);
    lh.setUint16(26, nameBytes.length, true);
    lh.setUint16(28, 0, true);
    const local = concat([new Uint8Array(lh.buffer), nameBytes, f.bytes]);
    locals.push(local);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, CENTRAL_SIG, true);
    ch.setUint16(4, VERSION, true);
    ch.setUint16(6, VERSION, true);
    ch.setUint16(8, 0, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, 0, true);
    ch.setUint16(14, DOS_DATE, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, size, true);
    ch.setUint32(24, size, true);
    ch.setUint16(28, nameBytes.length, true);
    ch.setUint16(30, 0, true);
    ch.setUint16(32, 0, true);
    ch.setUint16(34, 0, true);
    ch.setUint16(36, 0, true);
    ch.setUint32(38, 0, true);
    ch.setUint32(42, offset, true);
    centrals.push(concat([new Uint8Array(ch.buffer), nameBytes]));

    offset += local.length;
  }

  const localBlob = concat(locals);
  const centralBlob = concat(centrals);

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, EOCD_SIG, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, files.length, true);
  eocd.setUint16(10, files.length, true);
  eocd.setUint32(12, centralBlob.length, true);
  eocd.setUint32(16, localBlob.length, true);
  eocd.setUint16(20, 0, true);

  return concat([localBlob, centralBlob, new Uint8Array(eocd.buffer)]);
}
