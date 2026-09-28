import YouTubeLinks from "./YouTubeLinks";
import Instructions from "./Instructions";
import { demonstration, asset } from "./demos";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Pencil, Info, Play, Plus, Trash2, Video, Star } from "lucide-react";
import {
  db,
  dayKey,
  setting,
  putSetting,
  type Exercise,
  type SetLog,
} from "../../db/schema";
import { logSet, recomputePRs } from "../../db/queries";
import { round, toDisplay, toKg, e1rm, plates } from "../../domain/fitness";
import { Header, Sheet } from "../../components/ui";
import BodyDiagram from "../../components/BodyDiagram";
import { bundledPath, importMedia } from "./media";
import { useUI } from "../../store";
const ProgressChart = lazy(() => import("./ProgressChart"));
function useBlobURL(blob?: Blob) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
function MediaPage({
  blob,
  mime,
  active,
}: {
  blob: Blob;
  mime: string;
  active: boolean;
}) {
  const url = useBlobURL(blob);
  return mime.startsWith("video/") ? (
    active ? (
      <video src={url} autoPlay muted loop playsInline preload="metadata" />
    ) : (
      <Video size={40} />
    )
  ) : (
    <img src={url} alt="Exercise reference" />
  );
}
export default function ExerciseScreen() {
  const { id } = useParams();
  const exercise = useLiveQuery(() => db.exercises.get(id!), [id]);
  return exercise ? (
    <Detail key={exercise.id} exercise={exercise} />
  ) : (
    <Header title="Exercise" back />
  );
}
function Detail({ exercise: e }: { exercise: Exercise }) {
  const navigate = useNavigate();
  const sets = useLiveQuery(
    () =>
      db.sets
        .where("[exerciseId+createdAt]")
        .between([e.id, 0], [e.id, Infinity])
        .toArray(),
    [e.id],
  );
  const imported = useLiveQuery(() => db.videos.get(e.id), [e.id]);
  const extra =
    useLiveQuery(
      () => db.media.where("exerciseId").equals(e.id).sortBy("slot"),
      [e.id],
    ) ?? [];
  const savedUnit = useLiveQuery(() => setting("unit", "kg"));
  const unit = savedUnit ?? "kg";
  const rest = useLiveQuery(() => setting("restSeconds", 90)) ?? 90;
  const userUrl = useBlobURL(imported?.blob);
  const hiddenVideo = useLiveQuery(
    () => setting(`hiddenVideo:${e.id}`, false),
    [e.id],
  );
  const video = userUrl || (!hiddenVideo ? bundledPath(e.id) : undefined);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [warmup, setWarmup] = useState(false);
  const [sheet, setSheet] = useState("");
  const [active, setActive] = useState(0);
  const [edit, setEdit] = useState<SetLog>();
  const [busy, setBusy] = useState(false);
  const prefilled = useRef(false);
  const editedInputs = useRef({ weight: false, reps: false });
  const carousel = useRef<HTMLDivElement>(null);
  const notify = useUI((s) => s.notify);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (carousel.current) carousel.current.scrollLeft = 0;
      setActive(0);
    });
    return () => cancelAnimationFrame(frame);
  }, [video, extra.length]);
  useEffect(() => {
    if (sets && savedUnit !== undefined && !prefilled.current) {
      const last = sets.at(-1);
      if (!editedInputs.current.weight)
        setWeight(last ? String(round(toDisplay(last.weight, unit))) : "0");
      if (!editedInputs.current.reps) setReps(last ? String(last.reps) : "8");
      prefilled.current = true;
    }
  }, [sets, unit, savedUnit]);
  const today = (sets ?? []).filter((s) => dayKey(s.createdAt) === dayKey());
  const previous = (sets ?? []).filter((s) => dayKey(s.createdAt) !== dayKey());
  const demo = demonstration(e.id);
  const referencePages = [1, 2]
    .map((slot) => ({
      slot,
      media: extra.find((m) => m.slot === slot),
      image: demo?.images[slot - 1],
    }))
    .filter((p) => p.media || p.image);
  const pages = (video ? 1 : 0) + referencePages.length + 1;
  async function save() {
    setBusy(true);
    try {
      const row = await logSet(
        e.id,
        toKg(Number(weight), unit),
        Number(reps),
        rpe ? Number(rpe) : undefined,
        warmup,
      );
      notify(row.isPR ? "★ New personal record!" : "Set logged");
      useUI.getState().startRest(rest);
    } catch (err) {
      notify(String(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header
        title={e.name}
        back
        action={
          <button aria-label="Edit exercise" onClick={() => setSheet("edit")}>
            <Pencil />
          </button>
        }
      />
      <main className="detail">
        <div
          className="carousel"
          ref={carousel}
          onScroll={(event) =>
            setActive(
              Math.round(
                event.currentTarget.scrollLeft /
                  event.currentTarget.clientWidth,
              ),
            )
          }
        >
          {video && (
            <div className="media-page">
              {active === 0 && (
                <video
                  src={video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onClick={(event) => {
                    const v = event.currentTarget;
                    if (v.paused) void v.play();
                    else v.pause();
                  }}
                />
              )}
            </div>
          )}
          {referencePages.map((page, i) => (
            <div className="media-page" key={page.slot}>
              {page.media ? (
                <MediaPage
                  blob={page.media.blob}
                  mime={page.media.mime}
                  active={active === i + (video ? 1 : 0)}
                />
              ) : (
                <img
                  src={asset(page.image!)}
                  alt={`Step ${page.slot}: ${e.name}`}
                  loading="lazy"
                />
              )}
              <span className="demo-caption">STEP {page.slot}</span>
            </div>
          ))}
          <div className="media-page">
            <div className="anatomy-pair">
              <BodyDiagram group={e.groupId} />
              <BodyDiagram group={e.groupId} back />
            </div>
            {!video && (
              <button className="add-video" onClick={() => setSheet("edit")}>
                <Plus size={17} />
                Add your video
              </button>
            )}
            <span className="diagram-caption">MUSCLES WORKED</span>
          </div>
        </div>
        {demo && !userUrl && (
          <p className="demo-caption">
            {demo.kind === "photo-steps"
              ? "4-second photo step guide"
              : "4-second illustrated step guide"}{" "}
            · {demo.sourceName}
          </p>
        )}
        <div className="media-controls">
          <button
            className="info-button"
            aria-label="Form cues and notes"
            onClick={() => setSheet("info")}
          >
            <Info size={32} />
          </button>
          <div className="dots">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                aria-label={`Media page ${i + 1}`}
                className={i === active ? "active" : ""}
                onClick={() =>
                  carousel.current?.scrollTo({
                    left: i * carousel.current.clientWidth,
                    behavior: "smooth",
                  })
                }
              >
                <span />
              </button>
            ))}
          </div>
          <button
            className="play-button"
            aria-label="Play video fullscreen"
            disabled={!video}
            onClick={() => setSheet("video")}
          >
            <Play fill="currentColor" size={22} />
          </button>
        </div>
        <div className="detail-content">
          <form
            className="set-logger"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <label>
              WEIGHTS <small>{unit}</small>
              <input
                aria-label="Weight"
                inputMode="decimal"
                type="number"
                min="0"
                max="2000"
                step="any"
                required
                value={weight}
                onChange={(event) => {
                  editedInputs.current.weight = true;
                  setWeight(event.target.value);
                }}
              />
            </label>
            <label>
              REPS
              <input
                aria-label="Reps"
                inputMode="numeric"
                type="number"
                min="1"
                max="1000"
                required
                value={reps}
                onChange={(event) => {
                  editedInputs.current.reps = true;
                  setReps(event.target.value);
                }}
              />
            </label>
            <button
              aria-label="Log set"
              disabled={busy || !sets || savedUnit === undefined}
              type="submit"
            >
              <Plus size={48} strokeWidth={2} />
            </button>
          </form>
          <div className="set-options">
            <label>
              <input
                type="checkbox"
                checked={warmup}
                onChange={(event) => setWarmup(event.target.checked)}
              />{" "}
              Warm-up
            </label>
            <label>
              RPE{" "}
              <select
                value={rpe}
                onChange={(event) => setRpe(event.target.value)}
              >
                <option value="">—</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i}>{i + 1}</option>
                ))}
              </select>
            </label>
            <button onClick={() => setSheet("plates")}>Plate calculator</button>
          </div>
          {sets?.length ? (
            <div className="quick-stats">
              <div>
                <span>LAST SET</span>
                <strong>
                  {round(toDisplay(sets.at(-1)!.weight, unit))} ×{" "}
                  {sets.at(-1)!.reps}
                </strong>
              </div>
              <div>
                <span>BEST EST. 1RM</span>
                <strong>
                  {round(
                    toDisplay(
                      Math.max(
                        ...sets
                          .filter((s) => !s.isWarmup)
                          .map((s) => e1rm(s.weight, s.reps)),
                        0,
                      ),
                      unit,
                    ),
                  )}{" "}
                  {unit}
                </strong>
              </div>
            </div>
          ) : null}
          <section>
            <div className="section-title">
              <h2>Today's sets</h2>
              <span>{today.length} sets</span>
            </div>
            {!today.length && (
              <p className="empty">
                Your next rep starts here. Log your first set above.
              </p>
            )}
            {today.map((s, i) => (
              <SetRow
                key={s.id}
                row={s}
                index={i}
                unit={unit}
                edit={() => setEdit(s)}
                remove={async () => {
                  if (confirm("Delete this set?")) {
                    await db.sets.delete(s.id);
                    await recomputePRs(e.id);
                  }
                }}
              />
            ))}
          </section>
          <Suspense fallback={<div className="chart-placeholder" />}>
            <ProgressChart sets={sets ?? []} unit={unit} />
          </Suspense>
          <YouTubeLinks exercise={e} />
          <section>
            <h2>History</h2>
            {!previous.length && (
              <p className="empty">Past sessions will appear here.</p>
            )}
            {Array.from(new Set(previous.map((s) => dayKey(s.createdAt))))
              .reverse()
              .map((date) => (
                <div className="history-card" key={date}>
                  <h3>
                    {new Date(`${date}T12:00:00`).toLocaleDateString(
                      undefined,
                      { month: "long", day: "numeric", year: "numeric" },
                    )}
                  </h3>
                  {previous
                    .filter((s) => dayKey(s.createdAt) === date)
                    .map((s) => (
                      <p key={s.id}>
                        {round(toDisplay(s.weight, unit))} {unit} × {s.reps}{" "}
                        {s.isPR ? "★ PR" : ""}
                      </p>
                    ))}
                </div>
              ))}
          </section>
        </div>
      </main>
      {sheet === "info" && (
        <Instructions exercise={e} onClose={() => setSheet("")} />
      )}
      {sheet === "edit" && (
        <Editor
          exercise={e}
          close={() => setSheet("")}
          archive={() => navigate(-1)}
        />
      )}
      {sheet === "video" && (
        <div
          className="fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label="Video playback"
        >
          <button onClick={() => setSheet("")}>Done</button>
          <video src={video} controls autoPlay muted loop playsInline />
        </div>
      )}
      {sheet === "plates" && (
        <Sheet title="Plate calculator" onClose={() => setSheet("")}>
          <PlateCalculator initial={Number(weight)} unit={unit} />
        </Sheet>
      )}
      {edit && (
        <Sheet title="Edit set" onClose={() => setEdit(undefined)}>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await db.sets.put(edit);
              await recomputePRs(e.id);
              setEdit(undefined);
            }}
          >
            <label>
              Weight ({unit})
              <input
                type="number"
                min="0"
                step="any"
                required
                value={round(toDisplay(edit.weight, unit))}
                onChange={(event) =>
                  setEdit({
                    ...edit,
                    weight: toKg(Number(event.target.value), unit),
                  })
                }
              />
            </label>
            <label>
              Reps
              <input
                type="number"
                min="1"
                max="1000"
                required
                value={edit.reps}
                onChange={(event) =>
                  setEdit({ ...edit, reps: Number(event.target.value) })
                }
              />
            </label>
            <button className="primary">Save changes</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
function SetRow({
  row: s,
  index,
  unit,
  edit,
  remove,
}: {
  row: SetLog;
  index: number;
  unit: string;
  edit: () => void;
  remove: () => void;
}) {
  const start = useRef(0);
  const [revealed, setRevealed] = useState(false);
  return (
    <div
      className={`set-row ${revealed ? "revealed" : ""}`}
      onTouchStart={(e) => (start.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (start.current - e.changedTouches[0].clientX > 40) setRevealed(true);
        if (e.changedTouches[0].clientX - start.current > 40)
          setRevealed(false);
      }}
    >
      <span className="set-number">{index + 1}</span>
      <strong>
        {round(toDisplay(s.weight, unit))} <small>{unit}</small> × {s.reps}
      </strong>
      {s.isWarmup ? (
        <span className="badge">Warm-up</span>
      ) : s.isPR ? (
        <span className="badge">
          <Star size={12} />
          PR
        </span>
      ) : null}
      <button aria-label={`Edit set ${index + 1}`} onClick={edit}>
        <Pencil size={17} />
      </button>
      <button aria-label={`Delete set ${index + 1}`} onClick={remove}>
        <Trash2 size={17} />
      </button>
    </div>
  );
}
function Editor({
  exercise: e,
  close,
  archive,
}: {
  exercise: Exercise;
  close: () => void;
  archive: () => void;
}) {
  const [name, setName] = useState(e.name);
  const [notes, setNotes] = useState(e.notes ?? "");
  const [error, setError] = useState("");
  return (
    <Sheet title="Edit exercise" onClose={close}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await db.exercises.update(e.id, { name: name.trim(), notes });
          close();
        }}
      >
        {e.isCustom && (
          <label>
            Name
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}
        <label>
          My form cues & notes
          <textarea
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <p className="caption">
          H.264 MP4, 720p, under 1.5 MB recommended. Imported media stays on
          this device.
        </p>
        {[0, 1, 2].map((slot) => (
          <div className="media-edit" key={slot}>
            <label>
              {slot === 0 ? "Main video" : `Extra media ${slot}`}
              <input
                type="file"
                accept={slot === 0 ? "video/*" : "video/*,image/*"}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file)
                    try {
                      await importMedia(e.id, file);
                    } catch (err) {
                      setError(String(err));
                    }
                }}
              />
            </label>
            <button
              type="button"
              onClick={async () => {
                if (slot === 0) {
                  await db.videos.delete(e.id);
                  await putSetting(`hiddenVideo:${e.id}`, true);
                } else await db.media.delete(`${e.id}-${slot}`);
              }}
            >
              Remove {slot === 0 ? "video" : "media"}
            </button>
          </div>
        ))}
        <p className="error">{error}</p>
        <button className="primary">Save changes</button>
        {e.isCustom && (
          <button
            className="danger"
            type="button"
            onClick={async () => {
              if (
                confirm(
                  "Archive this exercise? Your logged sets are preserved.",
                )
              ) {
                await db.exercises.update(e.id, { archived: true });
                archive();
              }
            }}
          >
            Archive exercise
          </button>
        )}
      </form>
    </Sheet>
  );
}
function PlateCalculator({ initial, unit }: { initial: number; unit: string }) {
  const [total, setTotal] = useState(initial);
  const [bar, setBar] = useState(unit === "kg" ? 20 : 45);
  const p = plates(total, bar, unit);
  return (
    <>
      <label>
        Total weight ({unit})
        <input
          type="number"
          min="0"
          value={total}
          onChange={(e) => setTotal(Number(e.target.value))}
        />
      </label>
      <label>
        Bar weight
        <input
          type="number"
          min="0"
          value={bar}
          onChange={(e) => setBar(Number(e.target.value))}
        />
      </label>
      <p>
        Per side: {p.result.join(" + ") || "No plates"} {unit}
      </p>
      {p.invalid ? (
        <p className="error">Total must be at least the bar weight.</p>
      ) : p.remaining > 0 ? (
        <p className="caption">
          {round(p.remaining)} {unit} per side cannot be matched with standard
          plates.
        </p>
      ) : null}
    </>
  );
}
