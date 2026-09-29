import PinSettings from "../auth/PinSettings";
import InstallPanel from "./InstallPanel";
import { useAppName } from "../../hooks/useAppName";
import { lazy, Suspense, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Shield, Download, Upload } from "lucide-react";
import { db, dayKey, setting, putSetting } from "../../db/schema";
import {
  exportBackup,
  validateBackup,
  restoreBackup,
  type Backup,
} from "../../db/backup";
import { Header, Sheet } from "../../components/ui";

import { useUI } from "../../store";
const BodyJourney = lazy(() => import("../body/BodyJourney"));
export default function Profile() {
  const appName = useAppName();
  const storedAppName =
    useLiveQuery(() => setting("appName", "MyGymLog")) ?? "MyGymLog";
  const unit = useLiveQuery(() => setting("unit", "kg")) ?? "kg";
  const theme = useLiveQuery(() => setting("theme", "light")) ?? "light";
  const rest = useLiveQuery(() => setting("restSeconds", 90)) ?? 90;
  const last = useLiveQuery(() => setting("lastExport", 0)) ?? 0;
  const first =
    useLiveQuery(() => setting("firstUsed", Date.now())) ?? Date.now();
  const [storage, setStorage] = useState({
    usage: 0,
    quota: 0,
    persisted: false,
  });
  const [backup, setBackup] = useState<Backup>();
  const [include, setInclude] = useState(true);
  const [busy, setBusy] = useState(false);
  const notify = useUI((s) => s.notify);
  useEffect(() => {
    void Promise.all([
      navigator.storage?.estimate?.(),
      navigator.storage?.persisted?.(),
    ]).then(([s, p]) =>
      setStorage({
        usage: s?.usage ?? 0,
        quota: s?.quota ?? 0,
        persisted: p ?? false,
      }),
    );
  }, []);
  async function exportData() {
    setBusy(true);
    try {
      const blob = await exportBackup(include);
      const file = new File([blob], `mygymlog-${dayKey()}.json`, {
        type: "application/json",
      });
      if (navigator.canShare?.({ files: [file] }))
        await navigator.share({ files: [file], title: `${appName} backup` });
      else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      await putSetting("lastExport", Date.now());
      notify("Backup exported");
    } catch (e) {
      notify(`Export not completed: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header title="Profile" />
      <main className="content profile">
        <section className="privacy-card">
          <Shield size={29} />
          <div>
            <h3>Just you and your progress.</h3>
            <p>
              Your data lives on this device. No account, no cloud, no tracking.
            </p>
          </div>
        </section>
        <InstallPanel />
        <h2>Preferences</h2>
        <label className="app-name-field">
          App name
          <input
            maxLength={40}
            value={storedAppName}
            onChange={(e) => putSetting("appName", e.target.value)}
            placeholder="Your gym name"
          />
        </label>
        <p className="caption">
          Updates throughout the app immediately. iPhone Home Screen labels are
          managed by iOS; choose your preferred name when adding the app.
        </p>
        <label className="setting-row">
          Weight unit
          <select
            aria-label="Weight unit"
            value={unit}
            onChange={(e) => putSetting("unit", e.target.value)}
          >
            <option value="kg">Kilograms (kg)</option>
            <option value="lb">Pounds (lb)</option>
          </select>
        </label>
        <label className="setting-row">
          Rest timer
          <select
            value={rest}
            onChange={(e) => putSetting("restSeconds", Number(e.target.value))}
          >
            {[0, 60, 90, 120, 180].map((s) => (
              <option key={s} value={s}>
                {s ? `${s} seconds` : "Off"}
              </option>
            ))}
          </select>
        </label>
        <label className="setting-row">
          Appearance
          <select
            value={theme}
            onChange={(e) => putSetting("theme", e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </label>
        <Suspense fallback={<div className="chart-placeholder" />}>
          <BodyJourney unit={unit} />
        </Suspense>
        <section>
          <h2>Backup & restore</h2>
          <p className="caption">
            Keep a backup in Files or iCloud. Include media to restore your
            imported clips and images too.
          </p>
          {Date.now() - (last || first) > 14 * 86400000 && (
            <p className="reminder">
              It’s time for a fresh backup. Protect your progress.
            </p>
          )}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={include}
              onChange={(e) => setInclude(e.target.checked)}
            />
            Include imported videos, images and progress photos
          </label>
          <button disabled={busy} className="outline" onClick={exportData}>
            <Download size={19} />
            {busy ? "Preparing backup…" : "Export backup"}
          </button>
          <label className="outline file-button">
            <Upload size={19} />
            Import backup
            <input
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file)
                  try {
                    setBackup(validateBackup(JSON.parse(await file.text())));
                  } catch (err) {
                    notify(String(err));
                  }
                e.target.value = "";
              }}
            />
          </label>
          <p className="caption">
            Last export:{" "}
            {last ? new Date(last).toLocaleDateString() : "Not yet"}
          </p>
        </section>
        <PinSettings />
        <section>
          <h2>Privacy & storage</h2>
          <p className="caption">
            The PIN is a privacy lock, not encryption. Backups contain personal
            data and do not contain your PIN.
          </p>
          <p className="caption">
            {(storage.usage / 1024 / 1024).toFixed(1)} MB used ·{" "}
            {(storage.quota / 1024 / 1024).toFixed(0)} MB available quota
            <br />
            {storage.persisted
              ? "Persistent storage granted"
              : "Storage is managed by your browser. Keep regular backups."}
          </p>
          <button
            className="text-button"
            onClick={async () => {
              const persisted = await navigator.storage?.persist?.();
              setStorage({ ...storage, persisted: !!persisted });
              notify(
                persisted
                  ? "Persistent storage granted"
                  : "Browser did not grant persistence",
              );
            }}
          >
            Request persistent storage
          </button>
          <button
            className="danger"
            onClick={async () => {
              if (
                confirm(
                  "Permanently delete all workouts, media, plans, and your PIN? Export a backup first.",
                ) &&
                prompt("Type RESET to erase all data") === "RESET"
              ) {
                await db.delete();
                location.reload();
              }
            }}
          >
            Reset app
          </button>
        </section>
        <p className="profile-footer">
          {appName}
          <br />
          Built for the long run.
        </p>
      </main>
      {backup && (
        <Sheet title="Restore backup" onClose={() => setBackup(undefined)}>
          <p>
            {backup.tables.sets.length} sets · {backup.tables.workouts.length}{" "}
            workouts · {backup.tables.routines.length} plans ·{" "}
            {backup.media?.length ?? 0} media files
          </p>
          <p className="caption">
            Merge updates matching IDs and preserves other records. Replace
            deletes current data and restores this backup. Your current PIN is
            preserved.
          </p>
          <div className="button-row">
            {[false, true].map((replace) => (
              <button
                disabled={busy}
                className={replace ? "danger" : "primary"}
                key={String(replace)}
                onClick={async () => {
                  if (
                    replace &&
                    !confirm(
                      "Replace all current training data with this backup?",
                    )
                  )
                    return;
                  setBusy(true);
                  try {
                    await restoreBackup(backup, replace);
                    setBackup(undefined);
                    notify("Backup restored");
                  } catch (e) {
                    notify(String(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {replace ? "Replace" : "Merge"}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </>
  );
}
