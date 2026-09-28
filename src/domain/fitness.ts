import type { SetLog } from "../db/schema";
export const e1rm = (weight: number, reps: number) =>
  reps <= 0 ? 0 : reps === 1 ? weight : weight * (1 + reps / 30);
export const toDisplay = (kg: number, unit: string) =>
  unit === "lb" ? kg * 2.2046226218 : kg;
export const toKg = (weight: number, unit: string) =>
  unit === "lb" ? weight / 2.2046226218 : weight;
export const round = (n: number) => Math.round(n * 10) / 10;
export const volume = (sets: Pick<SetLog, "weight" | "reps">[]) =>
  sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
export function isPR(
  set: Pick<SetLog, "weight" | "reps" | "isWarmup">,
  history: Pick<SetLog, "weight" | "reps" | "isWarmup">[],
) {
  if (set.isWarmup) return false;
  const h = history.filter((s) => !s.isWarmup);
  return (
    !h.length ||
    set.weight > Math.max(...h.map((s) => s.weight)) ||
    e1rm(set.weight, set.reps) >
      Math.max(...h.map((s) => e1rm(s.weight, s.reps))) ||
    set.reps >
      Math.max(
        0,
        ...h.filter((s) => s.weight === set.weight).map((s) => s.reps),
      )
  );
}
export function plates(total: number, bar: number, unit: string) {
  let remaining = (total - bar) / 2;
  const result: number[] = [];
  for (const p of unit === "lb"
    ? [45, 35, 25, 10, 5, 2.5]
    : [25, 20, 15, 10, 5, 2.5, 1.25])
    while (remaining >= p) {
      result.push(p);
      remaining -= p;
    }
  return { result, remaining: Math.max(0, remaining), invalid: total < bar };
}
export function streak(dates: string[]) {
  const days = new Set(dates);
  let count = 0;
  const d = new Date();
  const key = () =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (!days.has(key())) d.setDate(d.getDate() - 1);
  while (days.has(key())) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
