import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
const source = readFileSync("src/db/seed.ts", "utf8");
const rows = [...source.matchAll(/^  (\w+): \[([\s\S]*?)\n  \]/gm)];
let todo =
  "# Exercise videos\n\nAdd H.264 MP4 clips (720p, preferably ≤1.5 MB) to `public/videos/`, then run `npm run media` and rebuild. Importing inside the app overrides a bundled clip. All seed exercises already have bundled four-second step guides. These filenames are optional overrides for your own continuous video clips.\n";
for (const [, group, items] of rows) {
  todo += `\n## ${group}\n\n`;
  for (const [, name] of items.matchAll(/"([^"]+)"/g)) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, "");
    todo += `- [ ] \`${slug}.mp4\` — ${name}\n`;
  }
}
if (rows.length !== 9)
  throw new Error("Could not parse all nine exercise groups.");
writeFileSync("VIDEOS_TODO.md", todo);
mkdirSync("public/posters", { recursive: true });
for (const file of readdirSync("public/videos").filter((f) =>
  f.endsWith(".mp4"),
)) {
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      `public/videos/${file}`,
      "-frames:v",
      "1",
      "-vf",
      "scale=240:-1",
      `public/posters/${file.replace(/\.mp4$/, ".jpg")}`,
    ],
    { stdio: "ignore" },
  );
  if (result.error || result.status)
    console.warn(
      `Poster not generated for ${file}; install ffmpeg to generate bundled thumbnails.`,
    );
}
console.log("Updated VIDEOS_TODO.md and available bundled posters.");
