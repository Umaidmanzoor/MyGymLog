import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 480, height: 360 },
  deviceScaleFactor: 1,
});
const guides = JSON.parse(readFileSync("scripts/original-guides.json", "utf8"));
for (const id of Object.keys(guides)) {
  for (let i = 0; i < 2; i++) {
    await page.setContent(
      `<style>body{margin:0}</style>${readFileSync(`public/demos/${id}/${i}.svg`, "utf8")}`,
    );
    await page.screenshot({ path: `/tmp/coral-${id}-${i}.png` });
  }
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-framerate",
    "1/2",
    "-i",
    `/tmp/coral-${id}-%d.png`,
    "-t",
    "4",
    "-r",
    "24",
    "-c:v",
    "libx264",
    "-crf",
    "27",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    `public/demos/${id}/loop.mp4`,
  ]);
}
await browser.close();
const manifest = JSON.parse(readFileSync("src/data/demos.json", "utf8"));
writeFileSync(
  "src/data/demos.json",
  JSON.stringify({ ...manifest, ...guides }, null, 2) + "\n",
);
console.log(`Rendered ${Object.keys(guides).length} original step guides.`);
