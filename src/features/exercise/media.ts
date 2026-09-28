import { demonstration, asset } from "./demos";
import { db, putSetting } from "../../db/schema";
import { saveMedia } from "../../db/mediaStorage";
const bundled = import.meta.glob("/public/videos/*.mp4", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const posters = import.meta.glob("/public/posters/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
export const bundledPoster = (id: string) =>
  posters[`/public/posters/${id}.jpg`] ||
  (demonstration(id)?.images[0]
    ? asset(demonstration(id).images[0])
    : undefined);
export const bundledPath = (id: string) =>
  bundled[`/public/videos/${id}.mp4`] ||
  (demonstration(id) ? asset(demonstration(id).video) : undefined);
export async function poster(blob: Blob): Promise<Blob | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    let done = false;
    const finish = (b?: Blob) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      v.removeAttribute("src");
      v.load();
      resolve(b);
    };
    const t = setTimeout(() => finish(), 5000);
    v.onloadeddata = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 240;
        c.height = (240 * v.videoHeight) / v.videoWidth;
        c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
        c.toBlob(
          (b) => {
            clearTimeout(t);
            finish(b ?? undefined);
          },
          "image/jpeg",
          0.75,
        );
      } catch {
        finish();
      }
    };
    v.onerror = () => finish();
    v.src = url;
    v.load();
  });
}
export async function importMedia(exerciseId: string, file: File, slot = 0) {
  if (
    file.size > 10 * 1024 * 1024 &&
    !confirm(
      "This file is larger than 10 MB and uses device storage. Import anyway?",
    )
  )
    return;
  // Materialize picker files: Safari may release their temporary file backing.
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  if (slot === 0) {
    if (!file.type.startsWith("video/"))
      throw Error("Select a video for the first page.");
    await saveMedia("videos", {
      exerciseId,
      blob,
      mime: file.type,
      updatedAt: Date.now(),
      poster: await poster(blob),
    });
    await putSetting(`hiddenVideo:${exerciseId}`, false);
  } else {
    if (!/^(image|video)\//.test(file.type))
      throw Error("Select an image or video.");
    await saveMedia("media", {
      id: `${exerciseId}-${slot}`,
      exerciseId,
      slot,
      blob,
      mime: file.type,
    });
  }
}
export async function cacheVideos(progress: (text: string) => void) {
  const paths = Object.values(bundled);
  const imported = (await db.videos.count()) + (await db.media.count());
  if (!paths.length && !imported) {
    progress("Add videos to save them offline");
    return;
  }
  const cache = await caches.open("exercise-videos");
  for (let i = 0; i < paths.length; i++) {
    if (!(await cache.match(paths[i]))) {
      const response = await fetch(paths[i]);
      if (!response.ok) throw Error("Video download failed. Try again online.");
      await cache.put(paths[i], response);
    }
    progress(`Saving ${i + 1} / ${paths.length}`);
  }
  progress("All videos saved");
}

export async function allVideosSaved() {
  const paths = Object.values(bundled);
  const imported = (await db.videos.count()) + (await db.media.count());
  if (!paths.length) return imported > 0;
  if (!globalThis.caches) return false;
  const cache = await caches.open("exercise-videos");
  return (await Promise.all(paths.map((p) => cache.match(p)))).every(Boolean);
}
