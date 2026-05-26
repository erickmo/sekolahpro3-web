import { describe, it, expect } from "vitest";
import { MASTER_CONFIGS } from "../masterConfigs";

describe("MASTER_CONFIGS", () => {
  it("contains expected doctypes", () => {
    const names = MASTER_CONFIGS.map((c) => c.doctype);
    expect(names).toEqual([
      "Fatwa DSN-MUI",
      "Denominasi Uang",
      "Sanctions List Entry",
      "Merchant",
    ]);
  });

  it("every config has at least one required field", () => {
    for (const c of MASTER_CONFIGS) {
      expect(c.fields.some((f) => f.required), `${c.doctype} needs a required field`).toBe(true);
    }
  });

  it("select fields always carry options", () => {
    for (const c of MASTER_CONFIGS) {
      for (const f of c.fields) {
        if (f.type === "select") {
          expect(f.options, `${c.doctype}.${f.name} select needs options`).toBeTruthy();
          expect((f.options ?? []).length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("listFields always include name", () => {
    for (const c of MASTER_CONFIGS) {
      expect(c.listFields).toContain("name");
    }
  });

  it("columns reference fields present in listFields or are computed", () => {
    for (const c of MASTER_CONFIGS) {
      for (const col of c.columns) {
        expect(c.listFields).toContain(col.key);
      }
    }
  });
});
