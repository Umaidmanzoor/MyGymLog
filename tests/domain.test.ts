import { describe, it, expect } from "vitest";
import {
  e1rm,
  isPR,
  toKg,
  toDisplay,
  volume,
  plates,
  streak,
} from "../src/domain/fitness";
import { hashPin, verifyPin } from "../src/features/auth/crypto";
import { library } from "../src/db/seed";
describe("training calculations", () => {
  it("calculates Epley and actual singles", () => {
    expect(e1rm(60, 10)).toBe(80);
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(50, 0)).toBe(0);
  });
  it("converts units without changing stored weight", () => {
    expect(toDisplay(100, "lb")).toBeCloseTo(220.46226);
    expect(toKg(toDisplay(87.5, "lb"), "lb")).toBeCloseTo(87.5);
  });
  it("detects weight, rep, and estimated max records, excluding warmups", () => {
    const h = [{ weight: 60, reps: 10 }];
    expect(isPR({ weight: 65, reps: 5 }, h)).toBe(true);
    expect(isPR({ weight: 60, reps: 11 }, h)).toBe(true);
    expect(isPR({ weight: 60, reps: 10 }, h)).toBe(false);
    expect(isPR({ weight: 90, reps: 10, isWarmup: true }, h)).toBe(false);
  });
  it("calculates volume and plates", () => {
    expect(
      volume([
        { weight: 50, reps: 10 },
        { weight: 60, reps: 8 },
      ]),
    ).toBe(980);
    expect(plates(100, 20, "kg").result).toEqual([25, 15]);
    expect(plates(10, 20, "kg").invalid).toBe(true);
  });
  it("seeds exact requested counts", () => {
    expect(Object.values(library).map((a) => a.length)).toEqual([
      17, 15, 20, 9, 23, 4, 20, 23, 18,
    ]);
  });
  it("empty streak is zero", () => expect(streak([])).toBe(0));
});
describe("PIN cryptography", () => {
  it("uses unique salts and verifies only the correct PIN", async () => {
    const first = await hashPin("123456");
    const second = await hashPin("123456");
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
    expect(first.salt).toHaveLength(32);
    expect(await verifyPin("123456", first.hash, first.salt)).toBe(true);
    expect(await verifyPin("123455", first.hash, first.salt)).toBe(false);
  });
});
