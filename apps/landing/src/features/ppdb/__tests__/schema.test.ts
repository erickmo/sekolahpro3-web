import { describe, it, expect } from "vitest";
import { calonSchema, ortuSchema, fullPpdbSchema, JENIS_DOKUMEN } from "../schema";

describe("calonSchema", () => {
  const valid = {
    nisn: "1234567890",
    nik: "3201234567890001",
    nama_lengkap: "Budi Test",
    tempat_lahir: "Jakarta",
    tanggal_lahir: "2010-06-01",
    jenis_kelamin: "L" as const,
    alamat: "Jl Test",
    asal_sekolah: "SDN 01",
    no_hp: "081234567890",
    email: "budi@test.id",
  };

  it("accepts valid payload", () => {
    expect(calonSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects NIK !=16 digits", () => {
    expect(calonSchema.safeParse({ ...valid, nik: "123" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(calonSchema.safeParse({ ...valid, email: "bad" }).success).toBe(false);
  });

  it("rejects no_hp non-08 prefix", () => {
    expect(calonSchema.safeParse({ ...valid, no_hp: "6281" }).success).toBe(false);
  });
});

describe("ortuSchema", () => {
  it("requires nama_ayah + nama_ibu", () => {
    const r = ortuSchema.safeParse({ nama_ayah: "", nama_ibu: "" });
    expect(r.success).toBe(false);
  });
});

describe("fullPpdbSchema", () => {
  it("rejects consent=false", () => {
    expect(fullPpdbSchema.safeParse({ consent: false }).success).toBe(false);
  });

  it("exposes 4 jenis dokumen", () => {
    expect(JENIS_DOKUMEN.length).toBe(4);
  });
});
