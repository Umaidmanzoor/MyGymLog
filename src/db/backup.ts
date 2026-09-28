import { youtubeURL } from "../domain/youtube";
import { binaryMedia } from "./mediaStorage";
import { db, type Setting } from "./schema";
const tableNames = [
  "groups",
  "exercises",
  "workouts",
  "sets",
  "routines",
  "bodyWeights",
  "settings",
] as const;
const privateKey = (key: string) =>
  key.startsWith("pin") || key === "lastActiveAt";
export interface Backup {
  version: 2 | 3;
  exportedAt: number;
  tables: Record<string, Record<string, unknown>[]>;
  media?: {
    table: "videos" | "media" | "bodyPhotos";
    row: Record<string, unknown>;
    data: string;
    poster?: string;
  }[];
}
const encode = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
const decode = (data: string) => {
  const [header, base] = data.split(",");
  const bytes = Uint8Array.from(atob(base), (x) => x.charCodeAt(0));
  return new Blob([bytes], {
    type: header.match(/:(.*?);/)?.[1] ?? "application/octet-stream",
  });
};
export async function exportBackup(includeMedia: boolean) {
  const tables: Backup["tables"] = {};
  await db.transaction("r", db.tables, async () => {
    for (const name of tableNames)
      tables[name] = await db.table(name).toArray();
  });
  tables.settings = tables.settings.filter((s) => !privateKey(s.key as string));
  const result: Backup = { version: 3, exportedAt: Date.now(), tables };
  if (includeMedia) {
    result.media = [];
    for (const table of ["videos", "media", "bodyPhotos"] as const) {
      for (const row of await db.table(table).toArray()) {
        const { blob, poster, ...rest } = row;
        result.media.push({
          table,
          row: rest,
          data: await encode(blob),
          poster: poster ? await encode(poster) : undefined,
        });
      }
    }
  }
  return new Blob([JSON.stringify(result)], { type: "application/json" });
}
export function validateBackup(input: unknown): Backup {
  if (!input || typeof input !== "object") throw Error("Invalid backup.");
  const b = input as Backup;
  if (![2, 3].includes(b.version) || !b.tables)
    throw Error("Unsupported backup version.");
  const ids = new Map<string, Set<string>>();
  for (const name of tableNames) {
    const rows = b.tables[name];
    if (!Array.isArray(rows)) throw Error(`Missing ${name} table.`);
    const seen = new Set<string>();
    for (const row of rows) {
      if (
        !row ||
        typeof row !== "object" ||
        typeof row[name === "settings" ? "key" : "id"] !== "string"
      )
        throw Error(`Invalid ${name} row.`);
      const id = row[name === "settings" ? "key" : "id"] as string;
      if (seen.has(id)) throw Error(`Duplicate ${name} ID.`);
      seen.add(id);
    }
    ids.set(name, seen);
  }
  for (const g of b.tables.groups)
    if (typeof g.name !== "string" || !Number.isFinite(g.order))
      throw Error("Invalid muscle group.");
  for (const s of b.tables.settings) {
    if (privateKey(s.key as string)) continue;
    if (!["string", "number", "boolean"].includes(typeof s.value))
      throw Error("Invalid setting value.");
    if (
      s.key === "appName" &&
      (typeof s.value !== "string" || s.value.length > 40)
    )
      throw Error("Invalid app name.");
    if (s.key === "unit" && !["kg", "lb"].includes(s.value as string))
      throw Error("Invalid weight unit.");
    if (
      s.key === "theme" &&
      !["light", "dark", "system"].includes(s.value as string)
    )
      throw Error("Invalid theme.");
    if (
      s.key === "restSeconds" &&
      (typeof s.value !== "number" || s.value < 0 || s.value > 3600)
    )
      throw Error("Invalid rest timer.");
  }
  for (const e of b.tables.exercises)
    if (
      typeof e.name !== "string" ||
      !ids.get("groups")!.has(e.groupId as string) ||
      typeof e.isCustom !== "boolean" ||
      (e.notes !== undefined && typeof e.notes !== "string") ||
      ![
        "barbell",
        "dumbbell",
        "machine",
        "cable",
        "bodyweight",
        "other",
      ].includes(e.equipment as string)
    )
      throw Error("Invalid exercise.");
  for (const e of b.tables.exercises)
    if (e.youtubeLinks !== undefined) {
      if (!Array.isArray(e.youtubeLinks)) throw Error("Invalid YouTube links.");
      for (const link of e.youtubeLinks) {
        if (
          !link ||
          typeof link.id !== "string" ||
          typeof link.label !== "string" ||
          typeof link.url !== "string"
        )
          throw Error("Invalid YouTube link.");
        youtubeURL(link.url);
      }
    }
  for (const w of b.tables.workouts)
    if (!Number.isFinite(w.startedAt)) throw Error("Invalid workout date.");
  for (const s of b.tables.sets)
    if (
      !ids.get("exercises")!.has(s.exerciseId as string) ||
      !ids.get("workouts")!.has(s.workoutId as string) ||
      typeof s.weight !== "number" ||
      !Number.isFinite(s.weight) ||
      s.weight < 0 ||
      !Number.isInteger(s.reps) ||
      Number(s.reps) < 1 ||
      !Number.isFinite(s.createdAt)
    )
      throw Error("Invalid set or broken reference.");
  for (const r of b.tables.routines)
    if (
      typeof r.name !== "string" ||
      !Array.isArray(r.exerciseIds) ||
      !r.exerciseIds.every((id) => ids.get("exercises")!.has(id))
    )
      throw Error("Invalid routine.");
  for (const w of b.tables.bodyWeights)
    if (
      typeof w.kg !== "number" ||
      !Number.isFinite(w.kg) ||
      w.kg <= 0 ||
      typeof w.date !== "string"
    )
      throw Error("Invalid body weight.");
  if (b.media !== undefined && !Array.isArray(b.media))
    throw Error("Invalid media.");
  for (const m of b.media ?? []) {
    if (
      !["videos", "media", "bodyPhotos"].includes(m.table) ||
      !m.row ||
      typeof m.row.mime !== "string" ||
      (m.table === "media" &&
        (typeof m.row.id !== "string" ||
          ![1, 2].includes(m.row.slot as number))) ||
      (m.table === "bodyPhotos"
        ? !ids.get("bodyWeights")!.has(m.row.id as string) ||
          !(m.row.mime as string).startsWith("image/")
        : !ids.get("exercises")!.has(m.row.exerciseId as string)) ||
      typeof m.data !== "string" ||
      !m.data.startsWith("data:")
    )
      throw Error("Invalid media entry.");
    decode(m.data);
    if (m.poster) decode(m.poster);
  }
  return b;
}
export async function restoreBackup(input: Backup, replace: boolean) {
  const b = validateBackup(input);
  const media = await Promise.all(
    (b.media ?? []).map(async (m) => ({
      ...m,
      decoded: await binaryMedia({
        ...m.row,
        blob: decode(m.data),
        ...(m.poster ? { poster: decode(m.poster) } : {}),
      }),
    })),
  );
  await db.transaction("rw", db.tables, async () => {
    const privateSettings = (await db.settings.toArray()).filter((s) =>
      privateKey(s.key),
    );
    if (replace) for (const table of db.tables) await table.clear();
    for (const name of tableNames) {
      const rows =
        name === "settings"
          ? b.tables[name].filter((s) => !privateKey(s.key as string))
          : b.tables[name];
      await db.table(name).bulkPut(rows);
    }
    await db.settings.bulkPut(privateSettings as Setting[]);
    for (const m of media) await db.table(m.table).put(m.decoded);
    await db.settings.put({ key: "seeded", value: true });
  });
}
