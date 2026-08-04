import type { SiteSnapshot } from "../types";
import { TagPill } from "./TagPill";

function Column({ site }: { site: SiteSnapshot }) {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="modal-column">
      <div className="modal-column-header">
        <strong>{site.name}</strong>
        <a href={site.url} target="_blank" rel="noreferrer">
          {site.url.replace(/^https?:\/\//, "")}
        </a>
      </div>
      {site.status === "ok" && site.screenshots ? (
        <img src={`${base}${site.screenshots.full}`} alt={`${site.name} full homepage`} />
      ) : (
        <div className="competitor-card-thumb-error">Capture failed: {site.error}</div>
      )}
      <div className="modal-column-meta">
        <div>
          <span className="meta-label">Nav L1s</span>
          <span>{site.navL1?.join(" · ") || "—"}</span>
        </div>
        <div>
          <span className="meta-label">Tags</span>
          <div className="competitor-card-tags">
            {site.tags.length ? site.tags.map((t) => <TagPill tag={t} key={t} />) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompetitorModal({
  site,
  own,
  onClose,
}: {
  site: SiteSnapshot;
  own: SiteSnapshot;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="modal-columns">
          <Column site={own} />
          {!site.isOwn && <Column site={site} />}
        </div>
      </div>
    </div>
  );
}
