import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Search, Dumbbell, Plus } from "lucide-react";
import { db, setting, type Exercise, type YouTubeLink } from "../../db/schema";
import { Header, Sheet, Empty } from "../../components/ui";
import BodyDiagram from "../../components/BodyDiagram";
import { importMedia, bundledPoster } from "../exercise/media";
import { round, toDisplay } from "../../domain/fitness";
import { YouTubeFields } from "../exercise/YouTubeLinks";
import { slug, library } from "../../db/seed";
export function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const last = useLiveQuery(
    () =>
      db.sets
        .where("[exerciseId+createdAt]")
        .between([exercise.id, 0], [exercise.id, Infinity])
        .last(),
    [exercise.id],
  );
  const video = useLiveQuery(() => db.videos.get(exercise.id), [exercise.id]);
  const [url, setUrl] = useState("");
  const unit = useLiveQuery(() => setting("unit", "kg")) ?? "kg";
  useEffect(() => {
    if (!video?.poster) {
      setUrl("");
      return;
    }
    const u = URL.createObjectURL(video.poster);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [video]);
  return (
    <Link className="exercise-row" to={`/exercise/${exercise.id}`}>
      <div className="exercise-thumb">
        {url || bundledPoster(exercise.id) ? (
          <img src={url || bundledPoster(exercise.id)} alt="" />
        ) : (
          <Dumbbell size={30} />
        )}
      </div>
      <div>
        <h3>{exercise.name}</h3>
        <p>
          {last
            ? `${round(toDisplay(last.weight, unit))} ${unit} × ${last.reps} · Last set`
            : exercise.equipment}
        </p>
      </div>
      <ChevronRight className="chevron" />
    </Link>
  );
}
export default function Library() {
  const groups = useLiveQuery(() => db.groups.orderBy("order").toArray()) ?? [];
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const [query, setQuery] = useState("");
  return (
    <>
      <Header title="Exercises" />
      <main className="library">
        <label className="search">
          <Search size={19} />
          <input
            placeholder="Find an exercise"
            aria-label="Search exercises"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {query
          ? exercises
              .filter(
                (e) =>
                  !e.archived &&
                  e.name.toLowerCase().includes(query.toLowerCase()),
              )
              .map((e) => <ExerciseRow key={e.id} exercise={e} />)
          : groups.map((g) => (
              <Link className="group-row" key={g.id} to={`/group/${g.id}`}>
                <div className="group-thumb">
                  <BodyDiagram
                    thumbnail
                    group={g.id}
                    back={g.id === "back" || g.id === "triceps"}
                  />
                </div>
                <div>
                  <h2>{g.name}</h2>
                  <span className="count-pill">
                    {
                      exercises.filter((e) => e.groupId === g.id && !e.archived)
                        .length
                    }{" "}
                    exercises
                  </span>
                </div>
                <ChevronRight className="chevron" />
              </Link>
            ))}
      </main>
    </>
  );
}
export function Group() {
  const { id } = useParams();
  const group = useLiveQuery(() => db.groups.get(id!), [id]);
  const exercises =
    useLiveQuery(
      () => db.exercises.where("groupId").equals(id!).toArray(),
      [id],
    ) ?? [];
  const [custom, setCustom] = useState(false);
  const [add, setAdd] = useState(false);
  return (
    <>
      <Header title={group?.name ?? "Exercises"} back />
      <main className="content">
        <div className="segments">
          <button
            className={!custom ? "active" : ""}
            onClick={() => setCustom(false)}
          >
            Exercises
          </button>
          <button
            className={custom ? "active" : ""}
            onClick={() => setCustom(true)}
          >
            Custom
          </button>
        </div>
        {exercises
          .filter((e) => e.isCustom === custom && !e.archived)
          .sort(
            (a, b) =>
              (library[group?.name ?? ""]?.indexOf(a.name) ?? 0) -
              (library[group?.name ?? ""]?.indexOf(b.name) ?? 0),
          )
          .map((e) => (
            <ExerciseRow key={e.id} exercise={e} />
          ))}
        {custom && (
          <>
            <button className="primary" onClick={() => setAdd(true)}>
              <Plus size={20} />
              Add exercise
            </button>
            {!exercises.some((e) => e.isCustom && !e.archived) && (
              <Empty>
                Add an exercise name and your YouTube links, or import your own
                demonstration.
              </Empty>
            )}
          </>
        )}
      </main>
      {add && <AddExercise groupId={id!} close={() => setAdd(false)} />}
    </>
  );
}
function AddExercise({
  groupId,
  close,
}: {
  groupId: string;
  close: () => void;
}) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState(groupId);
  const [equipment, setEquipment] = useState<Exercise["equipment"]>("other");
  const [file, setFile] = useState<File>();
  const [youtubeLinks, setYouTubeLinks] = useState<YouTubeLink[]>([]);
  const [error, setError] = useState("");
  const groups = useLiveQuery(() => db.groups.orderBy("order").toArray()) ?? [];
  return (
    <Sheet title="Add exercise" onClose={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const id = slug(name);
          if (!id || (await db.exercises.get(id))) {
            setError("Choose a unique exercise name.");
            return;
          }
          try {
            await db.exercises.add({
              id,
              name: name.trim(),
              groupId: group,
              equipment,
              isCustom: true,
              youtubeLinks,
            });
            if (file) await importMedia(id, file);
            close();
          } catch (err) {
            await db.exercises.delete(id);
            setError(String(err));
          }
        }}
      >
        <label>
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Muscle group
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Equipment
          <select
            value={equipment}
            onChange={(e) =>
              setEquipment(e.target.value as Exercise["equipment"])
            }
          >
            {[
              "barbell",
              "dumbbell",
              "machine",
              "cable",
              "bodyweight",
              "other",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <YouTubeFields links={youtubeLinks} onChange={setYouTubeLinks} />
        <label>
          Optional video
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0])}
          />
        </label>
        <p className="error">{error}</p>
        <button className="primary">Save exercise</button>
      </form>
    </Sheet>
  );
}
