import { useAppName } from "./hooks/useAppName";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Dumbbell, ClipboardList, History, User, Timer, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { db, setting, putSetting } from "./db/schema";
import { seed } from "./db/seed";
import { useUI } from "./store";
import Lock from "./features/auth/Lock";
const Library = lazy(() => import("./features/library/Library"));
const Group = lazy(() =>
  import("./features/library/Library").then((m) => ({ default: m.Group })),
);
const Exercise = lazy(() => import("./features/exercise/ExerciseScreen"));
const Plans = lazy(() => import("./features/workout/Plans"));
const Log = lazy(() => import("./features/workout/Log"));
const Profile = lazy(() => import("./features/settings/Profile"));
function Shell() {
  const location = useLocation();
  const toast = useUI((s) => s.toast);
  const detail = location.pathname.startsWith("/exercise/");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <Suspense fallback={<div className="route-placeholder" />}>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/group/:id" element={<Group />} />
          <Route path="/exercise/:id" element={<Exercise />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/log" element={<Log />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Library />} />
        </Routes>
      </Suspense>
      {!detail && (
        <nav className="bottom-tabs" aria-label="Main navigation">
          {[
            { to: "/", label: "Exercises", Icon: Dumbbell },
            { to: "/plans", label: "Plans", Icon: ClipboardList },
            { to: "/log", label: "Log", Icon: History },
            { to: "/profile", label: "Profile", Icon: User },
          ].map(({ to, label, Icon }) => (
            <NavLink
              end={to === "/"}
              className={({ isActive }) =>
                isActive ||
                (to === "/" && location.pathname.startsWith("/group"))
                  ? "active"
                  : ""
              }
              key={to}
              to={to}
            >
              <Icon size={25} strokeWidth={2.7} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
      <RestTimer detail={detail} />
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
function RestTimer({ detail }: { detail: boolean }) {
  const end = useUI((s) => s.restEnd);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!end) return;
    const tick = () => {
      setNow(Date.now());
      if (Date.now() >= end) {
        useUI.getState().startRest(0);
        navigator.vibrate?.([200, 100, 200]);
        useUI.getState().notify("Rest complete. Ready for your next set.");
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [end]);
  if (!end) return null;
  const seconds = Math.max(0, Math.ceil((end - now) / 1000));
  return (
    <aside
      className={`rest-timer ${detail ? "on-detail" : ""}`}
      aria-label="Rest timer"
    >
      <Timer size={19} />
      <strong>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </strong>
      <div>
        {[60, 90, 120, 180].map((s) => (
          <button key={s} onClick={() => useUI.getState().startRest(s)}>
            {s}s
          </button>
        ))}
      </div>
      <button
        aria-label="Stop timer"
        onClick={() => useUI.getState().startRest(0)}
      >
        <X size={18} />
      </button>
    </aside>
  );
}
export default function App() {
  const appName = useAppName();
  useEffect(() => {
    document.title = appName;
    document
      .querySelector('meta[name="apple-mobile-web-app-title"]')
      ?.setAttribute("content", appName);
  }, [appName]);
  const unlocked = useUI((s) => s.unlocked);
  const pinEnabled = useLiveQuery(() => setting("pinEnabled", false));
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState("");
  const theme = useLiveQuery(() => setting("theme", "light"));
  const {
    needRefresh: [refresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    seed()
      .then(() => {
        setReady(true);
        void navigator.storage?.persist?.().catch(() => false);
      })
      .catch((e) => setFailure(String(e)));
  }, []);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      (document.documentElement.dataset.theme =
        theme === "dark" || (theme === "system" && mq.matches)
          ? "dark"
          : "light");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    if (!pinEnabled) return;
    let hiddenAt = 0;
    const handler = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        void putSetting("lastActiveAt", hiddenAt);
      } else if (hiddenAt && Date.now() - hiddenAt >= 300000) {
        useUI.getState().lock();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [pinEnabled]);
  if (failure)
    return (
      <main className="content">
        <h1>Storage couldn’t open</h1>
        <p>{failure}</p>
        <p>Allow browser storage, then reload to try again.</p>
        <button onClick={() => location.reload()}>Reload</button>
      </main>
    );
  if (!ready || pinEnabled === undefined)
    return <div className="launch">{appName}</div>;
  return (
    <HashRouter>
      {!pinEnabled || unlocked ? <Shell /> : <Lock />}
      {refresh && (
        <button
          className="update-toast"
          onClick={() => updateServiceWorker(true)}
        >
          New version — Reload
        </button>
      )}
    </HashRouter>
  );
}
