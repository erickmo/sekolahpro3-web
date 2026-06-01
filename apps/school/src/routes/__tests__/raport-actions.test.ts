/**
 * Unit test for the raport status-transition matrix.
 *
 * Covers AKA-03: availableRaportActions must mirror the backend guards so the
 * UI only offers transitions the backend will accept.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@sekolahpro/api-client", () => ({
  useResourceDoc: vi.fn(() => ({ data: undefined, isLoading: true })),
  frappeFetch: vi.fn(),
}));

import { availableRaportActions } from "../sch.$sekolah.akademik.raport.$id";

const keys = (status: string | undefined) => availableRaportActions(status).map((a) => a.key);

describe("availableRaportActions", () => {
  it("Draft can only be finalised", () => {
    expect(keys("Draft")).toEqual(["finalkan"]);
  });

  it("Review can finalise, lock, or reset", () => {
    expect(keys("Review")).toEqual(["finalkan", "lock", "reset"]);
  });

  it("Submitted can lock or reset", () => {
    expect(keys("Submitted")).toEqual(["lock", "reset"]);
  });

  it("Final can cetak, lock, or reset", () => {
    expect(keys("Final")).toEqual(["cetak", "lock", "reset"]);
  });

  it("Locked can only revise or cetak (no reset)", () => {
    expect(keys("Locked")).toEqual(["revise", "cetak"]);
  });

  it("Revised can be reset to draft", () => {
    expect(keys("Revised")).toEqual(["reset"]);
  });

  it("Tercetak is terminal (no transitions)", () => {
    expect(keys("Tercetak")).toEqual([]);
  });

  it("returns no actions for an unknown status", () => {
    expect(keys(undefined)).toEqual([]);
    expect(keys("Mystery")).toEqual([]);
  });

  it("marks revise as needing an alasan", () => {
    const revise = availableRaportActions("Locked").find((a) => a.key === "revise");
    expect(revise?.needsAlasan).toBe(true);
  });
});
