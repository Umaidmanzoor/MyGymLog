import { useAppName } from "../../hooks/useAppName";
import { useEffect, useState } from "react";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { db, setting, putSetting } from "../../db/schema";
import { hashPin, verifyPin } from "./crypto";
import { useUI } from "../../store";
export default function Lock() {
  const appName = useAppName();
  const [exists, setExists] = useState<boolean>();
  const [pin, setPin] = useState("");
  const [first, setFirst] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setting("pinHash", "").then((h) => setExists(!!h));
    setting("pinCooldown", 0).then(setUntil);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  async function submit() {
    if (!/^\d{4,6}$/.test(pin)) {
      setError("Use 4–6 digits.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (exists) {
        if (until > Date.now()) return;
        const valid = await verifyPin(
          pin,
          await setting("pinHash", ""),
          await setting("pinSalt", ""),
        );
        if (!valid) {
          const attempts = (await setting("pinAttempts", 0)) + 1;
          await putSetting("pinAttempts", attempts);
          if (attempts >= 5) {
            const next = Date.now() + 30000 * 2 ** Math.min(attempts - 5, 10);
            await putSetting("pinCooldown", next);
            setUntil(next);
          }
          setError("Incorrect PIN. Try again.");
          setPin("");
          return;
        }
      } else {
        if (!first) {
          setFirst(pin);
          setPin("");
          return;
        }
        if (first !== pin) {
          setError("PINs did not match. Create your PIN again.");
          setFirst("");
          setPin("");
          return;
        }
        const result = await hashPin(pin);
        await db.settings.bulkPut([
          { key: "pinHash", value: result.hash },
          { key: "pinSalt", value: result.salt },
        ]);
        await navigator.storage?.persist?.();
      }
      await putSetting("pinAttempts", 0);
      await putSetting("pinCooldown", 0);
      useUI.getState().unlock();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="lock-screen">
      <div className="lock-brand">{appName}</div>
      <div className="lock-content">
        <div className="lock-icon">
          <LockKeyhole size={36} />
        </div>
        <p className="eyebrow">YOUR SPACE. YOUR PACE.</p>
        <h1>
          {exists
            ? "Welcome back."
            : first
              ? "Make it yours."
              : "A stronger you,\none day at a time."}
        </h1>
        <p>
          {exists
            ? "Enter your PIN to get back to training."
            : first
              ? "Re-enter your PIN to confirm."
              : "Create a 4–6 digit PIN to keep your training private."}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="sr-only" htmlFor="pin">
            PIN
          </label>
          <input
            id="pin"
            aria-label="PIN"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
          <button
            className="primary"
            disabled={busy || exists === undefined || until > now}
          >
            {until > now
              ? `Try again in ${Math.ceil((until - now) / 1000)}s`
              : exists
                ? "Unlock"
                : first
                  ? "Confirm PIN"
                  : "Create PIN"}{" "}
            <ArrowRight size={20} />
          </button>
        </form>
        <p role="alert" className="error">
          {error}
        </p>
        {exists && (
          <button
            className="text-button"
            onClick={async () => {
              if (
                confirm(
                  "Forgot PIN? Reset permanently deletes all local workouts, media and settings. Only an exported backup can restore them. Continue?",
                ) &&
                prompt("Type RESET to erase all data") === "RESET"
              ) {
                await db.delete();
                location.reload();
              }
            }}
          >
            Forgot PIN?
          </button>
        )}
      </div>
      <p className="lock-footer">No accounts. No noise. Just your progress.</p>
    </main>
  );
}
