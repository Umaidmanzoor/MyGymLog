import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { LockKeyhole } from "lucide-react";
import { db, setting } from "../../db/schema";
import { hashPin, verifyPin } from "./crypto";
import { Sheet } from "../../components/ui";
import { useUI } from "../../store";
export default function PinSettings() {
  const enabled = useLiveQuery(() => setting("pinEnabled", false)) ?? false;
  const [mode, setMode] = useState<"enable" | "change" | undefined>();
  const [old, setOld] = useState("");
  const [next, setNext] = useState("");
  const [confirmPin, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function open(mode: "enable" | "change") {
    setMode(mode);
    setOld("");
    setNext("");
    setConfirm("");
    setError("");
  }
  return (
    <section className="pin-settings">
      <h2>Optional passcode</h2>
      <label className="setting-row">
        Use a passcode
        <input
          aria-label="Use a passcode"
          role="switch"
          type="checkbox"
          checked={enabled}
          onChange={async (e) => {
            if (e.target.checked) {
              open("enable");
            } else {
              await db.transaction("rw", db.settings, async () => {
                await db.settings.put({ key: "pinEnabled", value: false });
                await db.settings.bulkDelete([
                  "pinHash",
                  "pinSalt",
                  "pinAttempts",
                  "pinCooldown",
                ]);
              });
              useUI.getState().unlock();
            }
          }}
        />
      </label>
      <p className="caption">
        Off by default. Turn it on to require your PIN when opening the app or
        returning after five minutes away. This is a privacy lock, not
        encryption.
      </p>
      {enabled && (
        <>
          <button className="outline" onClick={() => open("change")}>
            <LockKeyhole size={18} />
            Change PIN
          </button>
          <button className="outline" onClick={() => useUI.getState().lock()}>
            Lock now
          </button>
        </>
      )}
      {mode && (
        <Sheet
          title={mode === "enable" ? "Turn on passcode" : "Change PIN"}
          onClose={() => setMode(undefined)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                if (
                  mode === "change" &&
                  !(await verifyPin(
                    old,
                    await setting("pinHash", ""),
                    await setting("pinSalt", ""),
                  ))
                )
                  throw Error("Current PIN is incorrect.");
                if (!/^\d{4,6}$/.test(next) || next !== confirmPin)
                  throw Error("Enter matching 4–6 digit PINs.");
                const result = await hashPin(next);
                useUI.getState().unlock();
                await db.settings.bulkPut([
                  { key: "pinHash", value: result.hash },
                  { key: "pinSalt", value: result.salt },
                  { key: "pinEnabled", value: true },
                  { key: "pinAttempts", value: 0 },
                  { key: "pinCooldown", value: 0 },
                ]);
                setMode(undefined);
                useUI.getState().notify("Passcode enabled");
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {mode === "change" && (
              <label>
                Current PIN
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={old}
                  onChange={(e) => setOld(e.target.value)}
                />
              </label>
            )}
            <label>
              New PIN
              <input
                aria-label="New PIN"
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={next}
                onChange={(e) => setNext(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <label>
              Confirm new PIN
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={confirmPin}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <p className="error" role="alert">
              {error}
            </p>
            <button disabled={busy} className="primary">
              {busy
                ? "Saving…"
                : mode === "enable"
                  ? "Enable passcode"
                  : "Save PIN"}
            </button>
          </form>
        </Sheet>
      )}
    </section>
  );
}
