import { describe, expect, it } from "vitest";
import { groupKeysShape, type MySchoolsResponse } from "../sekolah";

describe("sekolah data types", () => {
  it("MySchoolsResponse shape exported", () => {
    const sample: MySchoolsResponse = {
      total_schools: 0, org_count: 0, groups: [],
    };
    expect(sample.total_schools).toBe(0);
  });

  it("groupKeysShape lists expected keys for runtime guards", () => {
    expect(groupKeysShape).toEqual(
      expect.arrayContaining(["organisasi", "organisasi_nama", "schools"]),
    );
  });
});
