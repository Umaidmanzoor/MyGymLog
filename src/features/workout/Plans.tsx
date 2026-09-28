import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { Plus, ArrowUp, ArrowDown, Trash2, Play } from "lucide-react";
import { db, type Routine } from "../../db/schema";
import { todayWorkout } from "../../db/queries";
import { Header, Sheet, Empty } from "../../components/ui";
import { useUI } from "../../store";
export default function Plans() {
  const routines =
    useLiveQuery(() => db.routines.orderBy("order").toArray()) ?? [];
  const groups = useLiveQuery(() => db.groups.orderBy("order").toArray()) ?? [];
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const workouts =
    useLiveQuery(() => db.workouts.orderBy("startedAt").reverse().toArray()) ??
    [];
  const today = workouts.find(
    (w) => new Date(w.startedAt).toDateString() === new Date().toDateString(),
  );
  const [edit, setEdit] = useState<Routine>();
  const [query, setQuery] = useState("");
  return (
    <>
      <Header
        title="Plans"
        action={
          <button
            aria-label="Create plan"
            onClick={() =>
              setEdit({
                id: crypto.randomUUID(),
                name: "",
                exerciseIds: [],
                order: routines.length,
              })
            }
          >
            <Plus />
          </button>
        }
      />
      <main className="content">
        <p className="eyebrow">A LITTLE STRUCTURE. MORE PROGRESS.</p>
        <h2>Your training, planned.</h2>
        {today?.queue?.length ? (
          <section className="card">
            <div className="section-title">
              <h3>Today's queue</h3>
              <span>{today.endedAt ? "Finished" : "In progress"}</span>
            </div>
            {today.queue.map((id, i) => (
              <Link
                className="queue-row"
                key={`${id}-${i}`}
                to={`/exercise/${id}`}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {exercises.find((e) => e.id === id)?.name ?? id}
              </Link>
            ))}
          </section>
        ) : null}
        {!routines.length && (
          <Empty>
            Build your Push, Pull, or Legs day. Keep your favorite exercises
            together and start in a tap.
          </Empty>
        )}
        {routines.map((r) => (
          <section className="plan-card" key={r.id}>
            <span className="eyebrow">
              ROUTINE {String(r.order + 1).padStart(2, "0")}
            </span>
            <h2>{r.name}</h2>
            <p>
              {r.exerciseIds.length} exercises ·{" "}
              {r.exerciseIds
                .slice(0, 3)
                .map((id) => exercises.find((e) => e.id === id)?.name)
                .join(", ")}
            </p>
            <div className="button-row">
              <button
                className="primary"
                onClick={async () => {
                  const w = await todayWorkout();
                  await db.workouts.update(w.id, {
                    routineId: r.id,
                    queue: r.exerciseIds,
                    endedAt: undefined,
                  });
                  useUI.getState().notify("Plan queued for today");
                }}
              >
                <Play size={16} />
                Start plan
              </button>
              <button
                onClick={() =>
                  setEdit({ ...r, exerciseIds: [...r.exerciseIds] })
                }
              >
                Edit
              </button>
            </div>
          </section>
        ))}
        <button
          className="outline"
          onClick={() =>
            setEdit({
              id: crypto.randomUUID(),
              name: "",
              exerciseIds: [],
              order: routines.length,
            })
          }
        >
          <Plus size={18} />
          Create a plan
        </button>
      </main>
      {edit && (
        <Sheet title="Build your plan" onClose={() => setEdit(undefined)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!edit.exerciseIds.length) return;
              await db.routines.put({ ...edit, name: edit.name.trim() });
              setEdit(undefined);
            }}
          >
            <label>
              Plan name
              <input
                required
                placeholder="e.g. Push day"
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </label>
            {edit.exerciseIds.map((id, i) => (
              <div className="routine-row" key={id}>
                <span>{exercises.find((e) => e.id === id)?.name}</span>
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => {
                    const ids = [...edit.exerciseIds];
                    [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
                    setEdit({ ...edit, exerciseIds: ids });
                  }}
                >
                  <ArrowUp size={17} />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === edit.exerciseIds.length - 1}
                  onClick={() => {
                    const ids = [...edit.exerciseIds];
                    [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]];
                    setEdit({ ...edit, exerciseIds: ids });
                  }}
                >
                  <ArrowDown size={17} />
                </button>
                <button
                  type="button"
                  aria-label="Remove exercise"
                  onClick={() =>
                    setEdit({
                      ...edit,
                      exerciseIds: edit.exerciseIds.filter((x) => x !== id),
                    })
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <label>
              Find exercises
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the library"
              />
            </label>
            <div className="picker-list">
              {groups.map((group) => {
                const matches = exercises.filter(
                  (e) =>
                    e.groupId === group.id &&
                    !e.archived &&
                    !edit.exerciseIds.includes(e.id) &&
                    e.name.toLowerCase().includes(query.toLowerCase()),
                );
                return matches.length ? (
                  <details
                    key={group.id}
                    className="plan-muscle-group"
                    open={query.trim() ? true : undefined}
                  >
                    <summary>
                      {group.name}
                      <span>{matches.length} exercises</span>
                    </summary>
                    {matches.map((e) => (
                      <button
                        type="button"
                        key={e.id}
                        onClick={() =>
                          setEdit({
                            ...edit,
                            exerciseIds: [...edit.exerciseIds, e.id],
                          })
                        }
                      >
                        {e.name}
                        <Plus size={16} />
                      </button>
                    ))}
                  </details>
                ) : null;
              })}
            </div>
            <button className="primary" disabled={!edit.exerciseIds.length}>
              Save plan
            </button>
            <button
              type="button"
              className="danger"
              onClick={async () => {
                if (confirm("Delete this plan?")) {
                  await db.routines.delete(edit.id);
                  setEdit(undefined);
                }
              }}
            >
              Delete plan
            </button>
          </form>
        </Sheet>
      )}
    </>
  );
}
