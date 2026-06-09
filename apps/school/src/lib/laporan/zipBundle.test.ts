import { describe, it, expect } from "vitest";
import { crc32, buildStoredZip } from "./zipBundle";

const enc = (s: string) => new TextEncoder().encode(s);

function findBytes(hay: Uint8Array, needle: Uint8Array): boolean {
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

describe("zipBundle — crc32", () => {
  it("is 0 for empty input", () => {
    expect(crc32(new Uint8Array())).toBe(0);
  });
  it("matches the known CRC-32 of 'hi' (== zlib.crc32)", () => {
    // CRC32("hi") = 0xD8932AAC (verified against python zlib.crc32)
    expect(crc32(enc("hi"))).toBe(0xd8932aac);
  });
});

describe("zipBundle — buildStoredZip", () => {
  it("starts with the local-file-header PK signature", () => {
    const zip = buildStoredZip([{ name: "a.txt", bytes: enc("hi") }]);
    expect([zip[0], zip[1], zip[2], zip[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it("ends with the EOCD PK signature record", () => {
    const zip = buildStoredZip([{ name: "a.txt", bytes: enc("hi") }]);
    const eocd = zip.slice(zip.length - 22, zip.length - 18);
    expect([...eocd]).toEqual([0x50, 0x4b, 0x05, 0x06]);
  });

  it("embeds each file name", () => {
    const zip = buildStoredZip([
      { name: "dapodik.xlsx", bytes: enc("x") },
      { name: "absensi.xlsx", bytes: enc("y") },
    ]);
    expect(findBytes(zip, enc("dapodik.xlsx"))).toBe(true);
    expect(findBytes(zip, enc("absensi.xlsx"))).toBe(true);
  });
});
