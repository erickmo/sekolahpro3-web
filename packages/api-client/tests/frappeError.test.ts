import { describe, it, expect } from "vitest";
import { humanizeFrappeError, FrappeResourceError } from "../src";

// Build a payload that mirrors what Frappe returns on a 417 MandatoryError.
function mandatoryPayload(doctype: string, field: string) {
  return {
    exc_type: "MandatoryError",
    _server_messages: JSON.stringify([
      JSON.stringify({ message: `Error: Value missing for ${doctype}: ${field}`, title: "Message" }),
    ]),
  };
}

describe("humanizeFrappeError", () => {
  it("turns a MandatoryError into '<Field> wajib diisi.'", () => {
    const err = new FrappeResourceError(417, mandatoryPayload("Lantai", "Sekolah"), "Frappe POST .../Lantai failed: 417");
    expect(humanizeFrappeError(err)).toBe("Sekolah wajib diisi.");
  });

  it("falls back to exc_type copy when no server message is parseable", () => {
    const err = new FrappeResourceError(417, { exc_type: "ValidationError" }, "boom");
    expect(humanizeFrappeError(err)).toBe("Data tidak valid. Periksa kembali isian Anda.");
  });

  it("maps a duplicate message to humane copy", () => {
    const payload = {
      exc_type: "DuplicateEntryError",
      _server_messages: JSON.stringify([JSON.stringify({ message: "Lantai GA-L1 already exists" })]),
    };
    const err = new FrappeResourceError(409, payload, "dup");
    expect(humanizeFrappeError(err)).toBe("Data dengan nilai unik yang sama sudah ada.");
  });

  it("returns null for a non-Frappe error so callers keep their own fallback", () => {
    expect(humanizeFrappeError(new Error("network down"))).toBeNull();
    expect(humanizeFrappeError(undefined)).toBeNull();
  });
});
