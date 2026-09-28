import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
const files = walk("dist");
const forbidden = files.filter((path) =>
  /(?:CODEX_PROMPT|GYM_APP_ARCHITECTURE|reference-|\.private|\.env|backup[^/]*\.json|\.map$)/i.test(
    relative("dist", path),
  ),
);
if (forbidden.length)
  throw Error(`Private files in production output: ${forbidden.join(", ")}`);
const manifest = JSON.parse(readFileSync("src/data/demos.json", "utf8"));
if (Object.keys(manifest).length !== 149)
  throw Error("Expected all 149 exercise guides.");
for (const entry of Object.values(manifest))
  for (const path of [entry.video, ...entry.images])
    if (!statSync(join("dist", path)).isFile())
      throw Error(`Missing bundled guide ${path}`);
console.log(
  `Release check passed: ${files.length} public files; 149 complete guides; no private documents or source maps.`,
);
