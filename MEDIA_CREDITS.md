# Exercise media credits

## Photo step guides

141 guides use exercise photos and instructions from [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db), which publishes its exercise dataset and imagery as public domain under the Unlicense. The upstream license is included in `public/licenses/free-exercise-db.txt`.

Each source exercise and exact source URL is recorded in `src/data/demos.json`. The application shows the demonstrated variant name. Four-second MP4 step loops were assembled from the two source photos without inventing intermediate motion. They are labelled photo step guides in the app.

## Original vector guides

Eight guides use original code-native SVG poses with four-second start/action loops: Hollow Body Hold, Bayesian Cable Curl, Single-Arm Cable Press, Lean-Away Lateral Raise, Y Raise, Pike Push-Up, Cross-Body Cable Extension, and Landmine Press. These are simplified form diagrams, not filmed demonstrations.

The muscle diagrams and app icon are original assets. Lucide icons are distributed under the ISC license; Montserrat is distributed under the SIL Open Font License through @fontsource.

## Updating guides

The checked-in media works without any external API. Regeneration is optional and is not part of normal builds. `scripts/fetch-demo-media.py` retrieves explicitly mapped upstream photos and uses ffmpeg for the photo loops. `scripts/original-guides.mjs` produces the vector poses; `scripts/render-original-guides.mjs` renders them with Playwright and ffmpeg. Review mappings before regenerating; similar names do not always mean the same movement.
