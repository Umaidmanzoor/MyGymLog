import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Camera, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { db, dayKey, type BodyWeight } from "../../db/schema";
import { binaryMedia } from "../../db/mediaStorage";
import { round, toDisplay, toKg } from "../../domain/fitness";
import { useUI } from "../../store";
const WeightChart = lazy(() => import("../settings/WeightChart"));
function Photo({ entry, near }: { entry: BodyWeight; near: boolean }) {
  const photo = useLiveQuery(
    () => (near ? db.bodyPhotos.get(entry.id) : undefined),
    [near, entry.id],
  );
  const [url, setURL] = useState("");
  useEffect(() => {
    if (!photo) {
      setURL("");
      return;
    }
    const url = URL.createObjectURL(photo.blob);
    setURL(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  return url ? (
    <img
      src={url}
      alt={`Progress photo from ${entry.date}`}
      onError={(e) => {
        e.currentTarget.alt =
          "This image format cannot be displayed. Replace it with a JPEG, PNG or WebP photo.";
      }}
    />
  ) : (
    <div className="photo-empty">
      <Camera size={38} />
      <p>No photo for {entry.date}</p>
      <span>Add one below to capture this moment.</span>
    </div>
  );
}
export default function BodyJourney({ unit }: { unit: string }) {
  const weights =
    useLiveQuery(() => db.bodyWeights.orderBy("date").toArray()) ?? [];
  const [selected, setSelected] = useState("");
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(dayKey());
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const slides = useRef<HTMLDivElement>(null);
  const pendingSelection = useRef("");
  const index = Math.max(
    0,
    weights.findIndex((w) => w.id === selected),
  );
  const current = weights[index];
  const currentPhoto = useLiveQuery(
    () => (current ? db.bodyPhotos.get(current.id) : undefined),
    [current?.id],
  );
  const notify = useUI((s) => s.notify);
  useEffect(() => {
    if (
      pendingSelection.current &&
      weights.some((w) => w.id === pendingSelection.current)
    ) {
      setSelected(pendingSelection.current);
      pendingSelection.current = "";
      return;
    }
    if (
      weights.length &&
      !pendingSelection.current &&
      !weights.some((w) => w.id === selected)
    )
      setSelected(weights.at(-1)!.id);
  }, [weights, selected]);
  useEffect(() => {
    if (slides.current)
      slides.current.scrollTo({
        left: index * slides.current.clientWidth,
        behavior: "instant",
      });
  }, [index, weights.length]);
  async function photoRow(id: string, picked: File) {
    if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/.test(picked.type))
      throw Error("Choose a JPEG, PNG, WebP or supported phone photo.");
    if (picked.size > 20 * 1024 * 1024)
      throw Error("Choose a photo under 20 MB.");
    return binaryMedia({
      id,
      mime: picked.type,
      blob: new Blob([await picked.arrayBuffer()], { type: picked.type }),
      updatedAt: Date.now(),
    });
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const kg = toKg(Number(weight), unit);
      if (!Number.isFinite(kg) || kg <= 0 || kg > 700)
        throw Error("Enter a valid body weight.");
      const photo = file ? await photoRow(date, file) : undefined;
      pendingSelection.current = date;
      await db.transaction("rw", db.bodyWeights, db.bodyPhotos, async () => {
        await db.bodyWeights.put({ id: date, date, kg });
        if (photo) await db.table("bodyPhotos").put(photo);
        else if (removePhoto) await db.bodyPhotos.delete(date);
      });
      if (weights.some((w) => w.id === date)) {
        setSelected(date);
        pendingSelection.current = "";
      }
      setWeight("");
      setFile(undefined);
      setRemovePhoto(false);
      if (input.current) input.current.value = "";
      notify("Body weight saved");
    } catch (e) {
      pendingSelection.current = "";
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="body-journey">
      <div className="section-title">
        <div>
          <p className="eyebrow">SEE HOW FAR YOU’VE COME</p>
          <h2>Body weight & photos</h2>
        </div>
        <span>
          {weights.at(-1)
            ? `${round(toDisplay(weights.at(-1)!.kg, unit))} ${unit}`
            : "Your journey"}
        </span>
      </div>
      {weights.length > 0 && (
        <>
          <div
            className="progress-photos"
            ref={slides}
            onScroll={(e) => {
              const i = Math.round(
                e.currentTarget.scrollLeft / e.currentTarget.clientWidth,
              );
              if (weights[i]) setSelected(weights[i].id);
            }}
          >
            {weights.map((w, i) => (
              <div className="progress-photo" key={w.id}>
                <Photo entry={w} near={Math.abs(i - index) <= 1} />
              </div>
            ))}
          </div>
          <div className="photo-caption">
            <button
              aria-label="Previous progress photo"
              disabled={index === 0}
              onClick={() => setSelected(weights[index - 1].id)}
            >
              <ChevronLeft />
            </button>
            <div>
              <strong>
                {current ? `${round(toDisplay(current.kg, unit))} ${unit}` : ""}
              </strong>
              <span>{current?.date}</span>
            </div>
            <button
              aria-label="Next progress photo"
              disabled={index === weights.length - 1}
              onClick={() => setSelected(weights[index + 1].id)}
            >
              <ChevronRight />
            </button>
          </div>
        </>
      )}
      <Suspense fallback={<div className="chart-placeholder" />}>
        <WeightChart
          weights={weights}
          unit={unit}
          selectedIndex={index}
          onSelect={(i) => {
            if (weights[i]) setSelected(weights[i].id);
          }}
        />
      </Suspense>
      {weights.length > 0 && (
        <>
          <label className="timeline-scrubber">
            Slide through your progress
            <input
              aria-label="Progress timeline"
              type="range"
              min="0"
              max={Math.max(0, weights.length - 1)}
              step="1"
              value={index}
              onChange={(e) => setSelected(weights[Number(e.target.value)].id)}
            />
          </label>
          <p className="caption">
            Drag across the graph, move the slider, or swipe your photos.
          </p>
          <div className="button-row">
            <label className="outline file-button">
              <Camera size={18} />
              {currentPhoto ? "Replace photo" : "Add photo"}
              <input
                aria-label="Photo for selected weight"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f && current) {
                    try {
                      await db
                        .table("bodyPhotos")
                        .put(await photoRow(current.id, f));
                      notify("Progress photo saved");
                    } catch (err) {
                      setError((err as Error).message);
                    }
                  }
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={() => {
                if (current) {
                  setDate(current.date);
                  setWeight(String(round(toDisplay(current.kg, unit))));
                  setRemovePhoto(false);
                }
              }}
            >
              Edit weight
            </button>
            {currentPhoto && (
              <button
                aria-label="Remove progress photo"
                onClick={async () => {
                  if (
                    current &&
                    confirm(
                      "Remove this progress photo? The weight entry stays.",
                    )
                  )
                    await db.bodyPhotos.delete(current.id);
                }}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </>
      )}
      <h3 className="journey-form-title">Record a check-in</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="body-form">
          <label>
            Date
            <input
              type="date"
              required
              max={dayKey()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setRemovePhoto(false);
              }}
            />
          </label>
          <label>
            {unit}
            <input
              aria-label="Body weight"
              type="number"
              inputMode="decimal"
              min="1"
              max="1500"
              step="any"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </label>
        </div>
        <label className="outline file-button">
          <Camera size={18} />
          {file ? file.name : "Attach a progress photo (optional)"}
          <input
            ref={input}
            aria-label="New progress photo"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0])}
          />
        </label>
        <p className="caption">
          One entry per date. Saving an existing date updates its weight and
          keeps its photo unless you replace it.
        </p>
        <p role="alert" className="error">
          {error}
        </p>
        <button disabled={busy} className="primary">
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
      <details className="weight-entries">
        <summary>All check-ins · {weights.length}</summary>
        {[...weights].reverse().map((w) => (
          <div className="setting-row" key={w.id}>
            <button onClick={() => setSelected(w.id)}>
              {w.date} · {round(toDisplay(w.kg, unit))} {unit}
            </button>
            <button
              aria-label={`Delete weight ${w.date}`}
              onClick={async () => {
                if (confirm("Delete this weight entry and its photo?"))
                  await db.transaction(
                    "rw",
                    db.bodyWeights,
                    db.bodyPhotos,
                    async () => {
                      await db.bodyWeights.delete(w.id);
                      await db.bodyPhotos.delete(w.id);
                    },
                  );
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </details>
    </section>
  );
}
