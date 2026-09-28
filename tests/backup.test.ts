import "fake-indexeddb/auto";
import { beforeEach, it, expect } from "vitest";
import { db } from "../src/db/schema";
import { seed } from "../src/db/seed";
import { logSet } from "../src/db/queries";
import { exportBackup, validateBackup, restoreBackup } from "../src/db/backup";
beforeEach(async () => {
  await db.delete();
  await db.open();
  await seed();
});
it("restores sets, routines and custom exercises while preserving the current PIN", async () => {
  await db.settings.put({ key: "pinHash", value: "private" });
  await db.exercises.add({
    id: "my-press",
    name: "My Press",
    groupId: "chest",
    equipment: "dumbbell",
    isCustom: true,
  });
  await logSet("my-press", 30, 10);
  await db.routines.add({
    id: "push",
    name: "Push",
    exerciseIds: ["my-press"],
    order: 0,
  });
  const b = validateBackup(
    JSON.parse(await (await exportBackup(false)).text()),
  );
  expect(b.tables.settings.some((s) => s.key === "pinHash")).toBe(false);
  await db.sets.clear();
  await db.routines.clear();
  await db.exercises.delete("my-press");
  await restoreBackup(b, true);
  expect(await db.sets.count()).toBe(1);
  expect((await db.routines.get("push"))?.exerciseIds).toEqual(["my-press"]);
  expect((await db.settings.get("pinHash"))?.value).toBe("private");
  await restoreBackup(b, false);
  expect(await db.sets.count()).toBe(1);
});
it("rejects invalid references before mutating data", async () => {
  await logSet("barbell-bench-press", 60, 8);
  const b = JSON.parse(await (await exportBackup(false)).text());
  b.tables.sets[0].exerciseId = "missing";
  expect(() => validateBackup(b)).toThrow();
  expect(await db.sets.count()).toBe(1);
});

it("rejects malformed preferences that could break the restored UI", async () => {
  const b = JSON.parse(await (await exportBackup(false)).text());
  b.tables.settings.push({ key: "unit", value: { bad: true } });
  expect(() => validateBackup(b)).toThrow("Invalid setting value");
});
