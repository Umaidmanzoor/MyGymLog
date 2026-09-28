import { useEffect, useRef } from "react";
import type { Exercise } from "../../db/schema";
import BodyDiagram from "../../components/BodyDiagram";
import { asset, demonstration } from "./demos";
export default function Instructions({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const demo = demonstration(exercise.id);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  const steps = demo?.steps.length
    ? demo.steps
    : exercise.notes
      ? [exercise.notes]
      : [];
  return (
    <dialog
      className="instructions-modal"
      ref={ref}
      onCancel={onClose}
      aria-label={`${exercise.name} instructions`}
    >
      <div className="instructions-top">
        <button onClick={onClose}>Done</button>
        <h2>{exercise.name}</h2>
      </div>
      <div className="instruction-strip">
        {demo?.images.map((image, i) => (
          <img
            key={image}
            src={asset(image)}
            alt={`Step ${i + 1}: ${exercise.name}`}
          />
        ))}
        <div>
          <BodyDiagram group={exercise.groupId} />
          <BodyDiagram group={exercise.groupId} back />
        </div>
      </div>
      <p className="instruction-muscle">
        Muscles: {demo?.muscles.join(", ") || exercise.groupId}
      </p>
      {demo && (
        <p className="instruction-source">
          {demo.kind === "original-guide"
            ? "Original illustrated form guide"
            : `Photo guide: ${demo.sourceName}`}
        </p>
      )}
      <ol className="instruction-steps">
        {steps.map((step, i) => (
          <li key={i}>
            <strong>Step {i + 1}: </strong>
            {step}
          </li>
        ))}
      </ol>
      {demo && exercise.notes && (
        <section>
          <h3>My cues & notes</h3>
          <p className="notes">{exercise.notes}</p>
        </section>
      )}
      {demo?.sourceURL && (
        <a
          className="instruction-credit"
          href={demo.sourceURL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Photos & instructions: Free Exercise DB · Public domain
        </a>
      )}
    </dialog>
  );
}
