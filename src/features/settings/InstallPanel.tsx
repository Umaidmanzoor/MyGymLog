import { useEffect, useState } from "react";
import { Share2, Smartphone, CheckCircle2 } from "lucide-react";
import { useAppName } from "../../hooks/useAppName";
import { useUI } from "../../store";
export default function InstallPanel() {
  const appName = useAppName();
  const [cached, setCached] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [local, setLocal] = useState(false);
  useEffect(() => {
    setInstalled(
      matchMedia("(display-mode: standalone)").matches ||
        !!(navigator as Navigator & { standalone?: boolean }).standalone,
    );
    setLocal(
      ["localhost", "127.0.0.1"].includes(location.hostname) ||
        location.protocol !== "https:",
    );
    let live = true;
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.ready.then(() => {
        if (live) setCached(true);
      });
    return () => {
      live = false;
    };
  }, []);
  async function share() {
    const url = new URL(import.meta.env.BASE_URL, location.href);
    url.hash = "";
    url.search = "";
    try {
      if (navigator.share)
        await navigator.share({
          title: appName,
          text: `Try ${appName} — your training stays on your device.`,
          url: url.href,
        });
      else {
        await navigator.clipboard.writeText(url.href);
        useUI.getState().notify("App link copied");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        useUI.getState().notify("Share the address in your browser.");
    }
  }
  return (
    <section className="install-panel">
      <div className="section-title">
        <h2>
          <Smartphone size={22} />
          On your iPhone
        </h2>
        {installed && <span>Installed</span>}
      </div>
      {local ? (
        <p className="caption">
          This is a local preview. Publish the production build to an HTTPS host
          first, then open that public link on your iPhone.
        </p>
      ) : (
        <ol>
          <li>
            Open this link in <strong>Safari</strong>.
          </li>
          <li>
            Tap <strong>Share → Add to Home Screen</strong>.
          </li>
          <li>
            Keep <strong>Open as Web App</strong> on if shown, then tap{" "}
            <strong>Add</strong>.
          </li>
          <li>Open the new icon and let offline setup finish once.</li>
        </ol>
      )}
      <p className={`offline-status ${cached ? "ready" : ""}`}>
        <CheckCircle2 size={17} />
        {cached
          ? "App and bundled guides are saved for offline use."
          : "Offline setup finishes after the first online load."}
      </p>
      <p className="caption">
        Workouts, photos, imported videos and settings stay in this browser’s
        storage on your iPhone. YouTube links need internet. Keep backups before
        clearing website data or changing devices.
      </p>
      <button className="outline" onClick={share} disabled={local}>
        <Share2 size={18} />
        Share app link
      </button>
      <p className="caption">
        Sharing this link sends only the app address. Your friend starts with
        their own empty training history. Exported backups contain your personal
        data—keep those private.
      </p>
    </section>
  );
}
