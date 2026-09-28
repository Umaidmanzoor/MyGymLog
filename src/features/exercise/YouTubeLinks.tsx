import { useState } from "react";
import { ExternalLink, Plus, Trash2, Youtube } from "lucide-react";
import { db, type Exercise, type YouTubeLink } from "../../db/schema";
import { youtubeURL } from "../../domain/youtube";
import { Sheet } from "../../components/ui";
export function YouTubeFields({
  links,
  onChange,
}: {
  links: YouTubeLink[];
  onChange: (links: YouTubeLink[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setURL] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="youtube-fields">
      <h3>YouTube videos</h3>
      <p className="caption">
        Add a form tutorial or your own recording. Links open on YouTube and
        need internet.
      </p>
      {links.map((link) => (
        <div className="youtube-row" key={link.id}>
          <Youtube size={20} />
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
          <button
            type="button"
            aria-label={`Remove ${link.label}`}
            onClick={() => onChange(links.filter((l) => l.id !== link.id))}
          >
            <Trash2 size={17} />
          </button>
        </div>
      ))}
      <label>
        Video title
        <input
          placeholder="e.g. My form check"
          value={label}
          maxLength={100}
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>
      <label>
        YouTube URL
        <input
          type="url"
          placeholder="https://youtu.be/…"
          value={url}
          onChange={(e) => setURL(e.target.value)}
        />
      </label>
      <button
        className="outline"
        type="button"
        onClick={() => {
          try {
            const normalized = youtubeURL(url);
            onChange([
              ...links,
              {
                id: crypto.randomUUID(),
                label: label.trim() || "Exercise tutorial",
                url: normalized,
              },
            ]);
            setLabel("");
            setURL("");
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <Plus size={17} />
        Add YouTube link
      </button>
      <p className="error" role="alert">
        {error}
      </p>
    </div>
  );
}
export default function YouTubeLinks({ exercise }: { exercise: Exercise }) {
  const [editing, setEditing] = useState(false);
  const [links, setLinks] = useState<YouTubeLink[]>([]);
  const [error, setError] = useState("");
  return (
    <section className="youtube-section">
      <div className="section-title">
        <h2>
          <Youtube size={22} />
          My YouTube videos
        </h2>
        <button
          aria-label="Manage YouTube links"
          onClick={() => {
            setLinks(exercise.youtubeLinks ?? []);
            setEditing(true);
          }}
        >
          <Plus size={21} />
        </button>
      </div>
      {exercise.youtubeLinks?.length ? (
        exercise.youtubeLinks.map((link) => (
          <a
            className="youtube-card"
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Youtube size={26} />
            <div>
              <strong>{link.label}</strong>
              <span>Watch on YouTube · Online</span>
            </div>
            <ExternalLink size={17} />
          </a>
        ))
      ) : (
        <button
          className="outline"
          onClick={() => {
            setLinks([]);
            setEditing(true);
          }}
        >
          Add a tutorial or your own video link
        </button>
      )}
      {editing && (
        <Sheet title="Exercise video links" onClose={() => setEditing(false)}>
          <YouTubeFields links={links} onChange={setLinks} />
          <p className="error">{error}</p>
          <button
            className="primary"
            onClick={async () => {
              try {
                await db.exercises.update(exercise.id, { youtubeLinks: links });
                setEditing(false);
              } catch (e) {
                setError(String(e));
              }
            }}
          >
            Save links
          </button>
        </Sheet>
      )}
    </section>
  );
}
