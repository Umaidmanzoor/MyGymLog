# **Hosted @** -  https://umaidmanzoor.github.io/MyGymLog/
# MyGymLog

A personal gym tracker that works offline on your iPhone. Browse 149 exercises, log sets, build plans, track body weight with photos, and keep your favorite YouTube tutorials together.

## Install on iPhone

1. Open the app’s **published HTTPS link in Safari**.
2. Tap **Share → Add to Home Screen**.
3. Leave **Open as Web App** on if shown, choose a name, and tap **Add**.
4. Open the new icon while online once. Profile shows when the app and bundled guides are saved for offline use.

The app opens directly to Exercises. A passcode is optional: turn on **Profile → Use a passcode** to create one. Turn it off to stop passcode prompts.

You need an HTTPS deployment for installation from another device; a computer’s localhost URL cannot be opened on your iPhone. No App Store submission or Apple Developer membership is needed. [Apple’s installation guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).

## Your data stays on your device

Workout sets, plans, weight entries, progress photos, imported media, YouTube links, and preferences are stored in IndexedDB on the device. There is no account, backend, automatic sync, or analytics.

**Sharing the app link does not share your data.** Every friend’s device starts with the same exercise library and its own empty history. The Share app link button sends only the address. People using the same browser profile on the same device share its local data; use a separate browser profile or device for a separate person.

An exported backup contains your personal data. Keep backups private unless you deliberately want someone to import them. Clearing website data, removing the app, switching browsers, or moving to a different hosting address can make local data unavailable. Export before moving and keep regular backups in Files or iCloud. Browser storage persistence is requested, but is not guaranteed.

## Features

- **Exercises:** nine muscle groups, search, demonstration loops, step images, muscle diagrams, form instructions, and custom exercises.
- **My YouTube videos:** save labelled tutorial links on any exercise. The Custom section in every muscle group also lets you create an exercise with YouTube links. Links open YouTube only when tapped and require internet.
- **Logging:** kg/lb conversion, last-set prefilling, warm-ups, RPE, PRs, a rest timer, editable sets, progress charts, and session history.
- **Plans:** browse exercises under their main muscle group, select them, reorder your routine, and queue it for today.
- **Body weight & photos:** attach one photo to each dated check-in. Drag across the graph, use the timeline slider, or swipe the photos to explore changes over time. Add or replace photos on existing entries. Saving an existing date updates its weight without removing its photo.
- **Profile:** instantly change the displayed app name, units, theme, rest time, optional passcode, and backup settings. Existing iPhone Home Screen labels are controlled by iOS; choose the preferred label when adding the app.

## Demonstrations and media

All 149 exercises include a four-second looping **step guide**, two reference images, and a muscle diagram. These loops alternate between start/action poses; they are not continuous filmed repetitions. 141 guides use photos from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), published under the Unlicense. Eight use original SVG form illustrations. The demonstrated variant is labelled where its name or equipment differs from the library name. See [MEDIA_CREDITS.md](MEDIA_CREDITS.md).

Guides are bundled locally and saved automatically with the app shell after the first complete online load. There is no Download all videos button. Open the info button for a coral instruction screen with numbered steps and your own notes.

Use the pencil on an exercise to import your own video or two additional images/videos. Imported primary video overrides the bundled guide. Removing it hides the primary fallback until another video is imported. `public/videos/<exercise-slug>.mp4` can also override the supplied guide on the next build. [VIDEOS_TODO.md](VIDEOS_TODO.md) lists override filenames. H.264 MP4 at 720p or lower is recommended. `npm run media` generates thumbnails for these optional overrides when ffmpeg is available.

Personal imports and progress photos stay in browser storage; they are never copied into the published site. Files deliberately placed in `public/` are part of the app and will be public.

## Backup and privacy

Export a JSON backup from Profile and save it to Files. Enable “Include imported videos, images and progress photos” to preserve your media as well as your training data. Import previews the contents and offers Merge or Replace. Restore is transactional and preserves the receiving device’s own passcode setting. Older version-2 backups are supported; new backups use version 3.

Passcodes are off unless explicitly enabled. Enabled passcodes use PBKDF2-SHA256 with 200,000 iterations and random salts; repeated failures trigger a cooldown. They lock on cold launch and after five minutes in the background. This is a privacy lock, not encryption. Passcodes are excluded from exports. If forgotten, reset the app and restore a backup.

## Development

Node 22 or newer:

```sh
npm install
npm run dev -- --host
```

```sh
npm test
npm run build
npm run preview -- --host
npx playwright install chromium webkit
npm run test:e2e
```

React, TypeScript, Vite, Tailwind, Dexie, Zustand, Recharts and Workbox. Routes use hashes, so static hosting needs no routing rewrites. Database schema upgrades preserve existing records. Main JavaScript is code-split; charts and media metadata load separately.

## Publish

### GitHub Pages

Push this repository to GitHub. Under **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**. The included Publish app workflow tests the app, builds it, and publishes only `dist/` when you push to `main` or `master`. Use the HTTPS address shown by the deployment. [GitHub Pages setup](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Other static hosts

Deploy **only `dist/`** after `npm run build`. Netlify configuration is included: build command `npm run build`, publish directory `dist`. The same output works on other HTTPS static hosts. No server credentials or runtime environment variables are required.

The release check verifies media coverage and excludes private documents, backup files, and source maps from the output. Local project notes, references, and backup folders are ignored by Git. Avoid uploading the whole workspace as a ZIP; publish the repository or `dist/`.

## Verification

Automated checks cover calculations, passcodes, backups, YouTube URL validation, media coverage, and mobile browser flows. Chromium tests cover offline reload. WebKit tests cover normal flows and cached assets; Playwright’s WebKit offline emulation reports an internal error on reload, so physical-iPhone airplane-mode testing remains necessary. Final Home Screen installation and device performance need checking on the chosen HTTPS deployment.
