import { useEffect, useState } from "react";
import type { TrendsData } from "../types";

const NOTES_KEY = "kl-dashboard-trend-notes";

interface Note {
  id: string;
  text: string;
  addedAt: string;
}

function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function TrendFeed({ trends }: { trends: TrendsData | null }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  function addNote() {
    if (!draft.trim()) return;
    const next = [{ id: crypto.randomUUID(), text: draft.trim(), addedAt: new Date().toISOString() }, ...notes];
    setNotes(next);
    localStorage.setItem(NOTES_KEY, JSON.stringify(next));
    setDraft("");
  }

  function removeNote(id: string) {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    localStorage.setItem(NOTES_KEY, JSON.stringify(next));
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Trends this week</h2>
        {trends?.isBaseline && <span className="tag-pill" data-muted>Baseline week</span>}
      </div>

      <ul className="trend-list">
        {trends?.narrative.length ? (
          trends.narrative.map((line, i) => (
            <li key={i} className="trend-list-item trend-list-item--auto">
              {line}
            </li>
          ))
        ) : (
          <li className="trend-list-item trend-list-item--empty">No automated signals yet.</li>
        )}
      </ul>

      <div className="trend-notes">
        <div className="panel-subheader">Your notes</div>
        <div className="trend-notes-input">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a qualitative observation for this week..."
            onKeyDown={(e) => e.key === "Enter" && addNote()}
          />
          <button onClick={addNote}>Add</button>
        </div>
        <ul className="trend-list">
          {notes.map((n) => (
            <li key={n.id} className="trend-list-item trend-list-item--manual">
              <span>{n.text}</span>
              <button className="trend-note-remove" onClick={() => removeNote(n.id)} aria-label="Remove note">
                ×
              </button>
            </li>
          ))}
        </ul>
        <p className="trend-notes-hint">Notes are saved to this browser only.</p>
      </div>
    </section>
  );
}
