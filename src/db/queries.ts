import { db, dayKey, type SetLog } from "./schema";
import { isPR } from "../domain/fitness";
export async function todayWorkout() {
  let w = await db.workouts
    .where("startedAt")
    .aboveOrEqual(new Date(`${dayKey()}T00:00:00`).getTime())
    .first();
  if (!w) {
    w = { id: crypto.randomUUID(), startedAt: Date.now() };
    await db.workouts.add(w);
  }
  return w;
}
export async function logSet(
  exerciseId: string,
  weight: number,
  reps: number,
  rpe?: number,
  isWarmup = false,
) {
  if (
    !Number.isFinite(weight) ||
    weight < 0 ||
    weight > 2000 ||
    !Number.isInteger(reps) ||
    reps < 1 ||
    reps > 1000
  )
    throw Error("Enter a valid weight and 1–1000 reps.");
  return db.transaction("rw", db.workouts, db.sets, async () => {
    const w = await todayWorkout();
    if (w.endedAt) await db.workouts.update(w.id, { endedAt: undefined });
    const history = await db.sets
      .where("exerciseId")
      .equals(exerciseId)
      .sortBy("createdAt");
    const row: SetLog = {
      id: crypto.randomUUID(),
      workoutId: w.id,
      exerciseId,
      weight,
      reps,
      rpe,
      isWarmup,
      setIndex: history.filter((s) => s.workoutId === w.id).length + 1,
      createdAt: Date.now(),
      isPR: isPR({ weight, reps, isWarmup }, history),
    };
    await db.sets.add(row);
    return row;
  });
}
export async function recomputePRs(exerciseId: string) {
  const rows = await db.sets
    .where("exerciseId")
    .equals(exerciseId)
    .sortBy("createdAt");
  await db.sets.bulkPut(
    rows.map((s, i) => ({ ...s, isPR: isPR(s, rows.slice(0, i)) })),
  );
}
