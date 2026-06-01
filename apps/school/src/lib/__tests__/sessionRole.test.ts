import { describe, it, expect } from "vitest";
import {
  normalizeRole,
  deriveRoles,
  type RoleMatcher,
  type DeriveRoleConfig,
} from "../sessionRole";

type DemoRole = "boss" | "staff" | "guest";

const MATCHERS: ReadonlyArray<RoleMatcher<DemoRole>> = [
  { needle: "boss", role: "boss" },
  { needle: "staff", role: "staff" },
  { needle: "guest", role: "guest" },
];

const CONFIG: DeriveRoleConfig<DemoRole> = {
  matchers: MATCHERS,
  allRoles: ["boss", "staff", "guest"],
  priority: ["boss", "staff", "guest"],
  defaultPrimary: "staff",
};

describe("normalizeRole", () => {
  it("lowercases and collapses spaces/dashes into underscores", () => {
    expect(normalizeRole("Kepala Sekolah")).toBe("kepala_sekolah");
    expect(normalizeRole("kepala-sekolah")).toBe("kepala_sekolah");
    expect(normalizeRole("  Super-Admin  ")).toBe("super_admin");
  });
});

describe("deriveRoles", () => {
  it("returns permissive fallback (all roles + defaultPrimary) for empty input", () => {
    const res = deriveRoles([], CONFIG);
    expect(res.roles).toEqual(["boss", "staff", "guest"]);
    expect(res.primary).toBe("staff");
  });

  it("returns permissive fallback when nothing matches", () => {
    const res = deriveRoles(["Totally Unknown Role"], CONFIG);
    expect(res.roles).toEqual(["boss", "staff", "guest"]);
    expect(res.primary).toBe("staff");
  });

  it("maps only matched roles and picks primary by priority", () => {
    const res = deriveRoles(["Staff Member", "Boss Lady"], CONFIG);
    expect(new Set(res.roles)).toEqual(new Set<DemoRole>(["staff", "boss"]));
    expect(res.primary).toBe("boss");
  });

  it("matches tolerant of case/spacing/dashes", () => {
    const res = deriveRoles(["the-STAFF-desk"], CONFIG);
    expect(res.roles).toEqual(["staff"]);
    expect(res.primary).toBe("staff");
  });

  it("dedupes when multiple raw roles map to the same bucket", () => {
    const res = deriveRoles(["staff one", "staff two"], CONFIG);
    expect(res.roles).toEqual(["staff"]);
  });
});
