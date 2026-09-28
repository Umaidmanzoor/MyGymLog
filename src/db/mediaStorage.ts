import { db } from "./schema";
export async function binaryMedia(row: Record<string, unknown>) {
  const { blob, poster, ...rest } = row;
  if (!(blob instanceof Blob)) throw Error("Missing media content");
  return {
    ...rest,
    blobBytes: await blob.arrayBuffer(),
    ...(poster instanceof Blob
      ? { posterBytes: await poster.arrayBuffer(), posterMime: poster.type }
      : {}),
  };
}
export async function saveMedia(
  table: "videos" | "media" | "bodyPhotos",
  row: Record<string, unknown>,
) {
  try {
    await db.table(table).put(row);
  } catch (error) {
    const name = (error as Error).name;
    if (name !== "UnknownError" && name !== "DataCloneError") throw error;
    await db.table(table).put(await binaryMedia(row));
  }
}
