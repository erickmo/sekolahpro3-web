import { beforeEach, describe, expect, it } from "vitest";
import { loadDraft, saveDraft, clearDraft, DRAFT_KEY } from "../storage";

beforeEach(() => sessionStorage.clear());

describe("ppdb storage", () => {
  it("saves and loads draft", () => {
    saveDraft({ calon: { nama_lengkap: "X" } });
    expect(loadDraft()).toEqual({ calon: { nama_lengkap: "X" } });
  });

  it("returns null when empty", () => {
    expect(loadDraft()).toBeNull();
  });

  it("clears draft", () => {
    saveDraft({ x: 1 });
    clearDraft();
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("recovers from corrupt JSON", () => {
    sessionStorage.setItem(DRAFT_KEY, "{not json");
    expect(loadDraft()).toBeNull();
  });
});
