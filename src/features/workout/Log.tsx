import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { ChevronRight, Flame } from "lucide-react";
import { db, dayKey, setting, type Workout } from "../../db/schema";
import { volume, round, toDisplay, streak } from "../../domain/fitness";
import { Header, Sheet, Empty } from "../../components/ui";
export default function Log() {
  const workouts =
    useLiveQuery(() => db.workouts.orderBy("startedAt").reverse().toArray()) ??
    [];
  const sets = useLiveQuery(() => db.sets.toArray()) ?? [];
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const unit = useLiveQuery(() => setting("unit", "kg")) ?? "kg";
  const [selected, setSelected] = useState<Workout>();
  const [filter, setFilter] = useState("");
  const active = workouts.filter((w) => sets.some((s) => s.workoutId === w.id));
  const dates = active.map((w) => dayKey(w.startedAt));
  return (
    <>
      <Header title="Log" />
      <main className="content">
        <div className="section-title">
          <div>
            <p className="eyebrow">SHOWING UP ADDS UP</p>
            <h2>Your consistency.</h2>
          </div>
          <span className="streak">
            <Flame size={19} />
            {streak(dates)} day streak
          </span>
        </div>
        <div className="heatmap" aria-label="Workout calendar, last 12 weeks">
          {Array.from({ length: 84 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - 83 + i);
            const key = dayKey(d.getTime());
            const count = sets.filter(
              (s) => dayKey(s.createdAt) === key,
            ).length;
            return (
              <button
                key={key}
                aria-label={`${key}: ${count} sets`}
                title={`${key}: ${count} sets`}
                className={`${count ? "trained" : ""} ${filter === key ? "chosen" : ""}`}
                style={{ opacity: count ? Math.min(0.4 + count / 20, 1) : 1 }}
                onClick={() => setFilter(filter === key ? "" : key)}
              >
                <span className="sr-only">{key}</span>
              </button>
            );
          })}
        </div>
        <p className="caption">Last 12 weeks · Tap a day to filter</p>
        <div className="quick-stats">
          <div>
            <span>WORKOUTS</span>
            <strong>{active.length}</strong>
          </div>
          <div>
            <span>TOTAL SETS</span>
            <strong>{sets.length}</strong>
          </div>
        </div>
        <div className="section-title">
          <h2>{filter || "Workout history"}</h2>
          {filter && <button onClick={() => setFilter("")}>Clear</button>}
        </div>
        {!active.length && (
          <Empty>
            Every session is a step forward. Your workouts will appear here.
          </Empty>
        )}
        {active
          .filter((w) => !filter || dayKey(w.startedAt) === filter)
          .map((w) => {
            const rows = sets.filter((s) => s.workoutId === w.id);
            return (
              <button
                className="workout-card"
                key={w.id}
                onClick={() => setSelected(w)}
              >
                <div className="date-tile">
                  <strong>{new Date(w.startedAt).getDate()}</strong>
                  <span>
                    {new Date(w.startedAt).toLocaleDateString(undefined, {
                      month: "short",
                    })}
                  </span>
                </div>
                <div>
                  <h3>
                    {new Date(w.startedAt).toLocaleDateString(undefined, {
                      weekday: "long",
                    })}{" "}
                    workout
                  </h3>
                  <p>
                    {rows.length} sets ·{" "}
                    {round(toDisplay(volume(rows), unit)).toLocaleString()}{" "}
                    {unit} volume
                  </p>
                </div>
                <ChevronRight />
              </button>
            );
          })}
        <Link className="primary" to="/">
          Add an exercise
        </Link>
      </main>
      {selected && (
        <Sheet
          title={new Date(selected.startedAt).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
          })}
          onClose={() => setSelected(undefined)}
        >
          <p className="caption">
            {selected.endedAt
              ? `Completed · ${Math.max(1, Math.round((selected.endedAt - selected.startedAt) / 60000))} minutes`
              : `Started ${new Date(selected.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          </p>
          {Array.from(
            new Set(
              sets
                .filter((s) => s.workoutId === selected.id)
                .map((s) => s.exerciseId),
            ),
          ).map((id) => (
            <div className="history-card" key={id}>
              <Link
                to={`/exercise/${id}`}
                onClick={() => setSelected(undefined)}
              >
                <h3>{exercises.find((e) => e.id === id)?.name ?? id}</h3>
              </Link>
              {sets
                .filter(
                  (s) => s.workoutId === selected.id && s.exerciseId === id,
                )
                .map((s) => (
                  <p key={s.id}>
                    {round(toDisplay(s.weight, unit))} {unit} × {s.reps}{" "}
                    {s.isPR ? "★" : ""}
                  </p>
                ))}
            </div>
          ))}
          {!selected.endedAt && (
            <button
              className="primary"
              onClick={async () => {
                await db.workouts.update(selected.id, { endedAt: Date.now() });
                setSelected(undefined);
              }}
            >
              Finish workout
            </button>
          )}
        </Sheet>
      )}
    </>
  );
}
