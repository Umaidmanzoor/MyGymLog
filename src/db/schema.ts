import Dexie, { type Table } from "dexie";
export interface MuscleGroup {
  id: string;
  name: string;
  icon: string;
  order: number;
}
export interface YouTubeLink {
  id: string;
  label: string;
  url: string;
}
export interface BodyPhoto {
  id: string;
  blob: Blob;
  mime: string;
  updatedAt: number;
}
export interface Exercise {
  youtubeLinks?: YouTubeLink[];
  id: string;
  groupId: string;
  name: string;
  equipment:
    "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "other";
  isCustom: boolean;
  bundledVideo?: string;
  notes?: string;
  archived?: boolean;
}
export interface UserVideo {
  exerciseId: string;
  blob: Blob;
  mime: string;
  updatedAt: number;
  poster?: Blob;
}
export interface Media {
  id: string;
  exerciseId: string;
  slot: number;
  blob: Blob;
  mime: string;
}
export interface Workout {
  id: string;
  startedAt: number;
  endedAt?: number;
  note?: string;
  routineId?: string;
  queue?: string[];
}
export interface SetLog {
  id: string;
  workoutId: string;
  exerciseId: string;
  setIndex: number;
  weight: number;
  reps: number;
  rpe?: number;
  isWarmup?: boolean;
  isPR?: boolean;
  createdAt: number;
}
export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[];
  order: number;
}
export interface BodyWeight {
  id: string;
  date: string;
  kg: number;
}
export interface Setting {
  key: string;
  value: unknown;
}
class GymDB extends Dexie {
  groups!: Table<MuscleGroup, string>;
  exercises!: Table<Exercise, string>;
  videos!: Table<UserVideo, string>;
  media!: Table<Media, string>;
  workouts!: Table<Workout, string>;
  sets!: Table<SetLog, string>;
  routines!: Table<Routine, string>;
  bodyWeights!: Table<BodyWeight, string>;
  bodyPhotos!: Table<BodyPhoto, string>;
  settings!: Table<Setting, string>;
  constructor() {
    super("coral-gym");
    this.version(1).stores({
      groups: "id,order",
      exercises: "id,groupId",
      videos: "exerciseId",
      workouts: "id,startedAt",
      sets: "id,[exerciseId+createdAt],exerciseId,workoutId,createdAt",
      routines: "id,order",
      bodyWeights: "id,date",
      settings: "key",
    });
    this.version(2).stores({ media: "id,exerciseId,[exerciseId+slot]" });
    // v3 accepts binary media fallback records; existing Blob records remain valid.
    this.version(3).stores({
      videos: "exerciseId",
      media: "id,exerciseId,[exerciseId+slot]",
    });
    this.version(4).stores({ bodyPhotos: "id" });
    for (const name of ["videos", "media", "bodyPhotos"])
      this.table(name).hook("reading", (row) => {
        if (!row) return row;
        if (row.blobBytes) {
          row.blob = new Blob([row.blobBytes], { type: row.mime });
          delete row.blobBytes;
        }
        if (row.posterBytes) {
          row.poster = new Blob([row.posterBytes], {
            type: row.posterMime || "image/jpeg",
          });
          delete row.posterBytes;
          delete row.posterMime;
        }
        return row;
      });
  }
}
export const db = new GymDB();
export async function setting<T>(key: string, fallback: T): Promise<T> {
  return ((await db.settings.get(key))?.value as T) ?? fallback;
}
export const putSetting = (key: string, value: unknown) =>
  db.settings.put({ key, value });
export const dayKey = (time = Date.now()) => {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
