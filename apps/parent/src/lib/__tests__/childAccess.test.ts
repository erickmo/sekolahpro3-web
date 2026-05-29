import { describe, it, expect } from "vitest";
import { FrappeError } from "@sekolahpro/api-client";
import { CHILD_QUERY_PREFIX, isChildQueryKey, isForbidden, nisFromQueryKey } from "../childAccess";

describe("childAccess helpers", () => {
  it("matches per-child query keys only", () => {
    expect(isChildQueryKey([`${CHILD_QUERY_PREFIX}dashboard`, { nis: "1" }])).toBe(true);
    expect(isChildQueryKey(["sekolahpro.api.parent.list_pesan"])).toBe(false);
    expect(isChildQueryKey("nope")).toBe(false);
  });

  it("detects FrappeError 403 only", () => {
    expect(isForbidden(new FrappeError(403, null, "forbidden"))).toBe(true);
    expect(isForbidden(new FrappeError(404, null, "missing"))).toBe(false);
    expect(isForbidden(new Error("plain"))).toBe(false);
  });

  it("extracts nis from query key args", () => {
    expect(nisFromQueryKey([`${CHILD_QUERY_PREFIX}nilai`, { nis: "1002" }])).toBe("1002");
    expect(nisFromQueryKey([`${CHILD_QUERY_PREFIX}nilai`, {}])).toBe(null);
    expect(nisFromQueryKey("x")).toBe(null);
  });
});
