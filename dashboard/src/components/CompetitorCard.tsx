import type { SiteSnapshot } from "../types";
import { TagPill } from "./TagPill";

export function CompetitorCard({
  site,
  onOpen,
  isNew,
}: {
  site: SiteSnapshot;
  onOpen: () => void;
  isNew?: boolean;
}) {
  const base = import.meta.env.BASE_URL;
  return (
    <button className={`competitor-card${site.isOwn ? " competitor-card--own" : ""}`} onClick={onOpen}>
      <div className="competitor-card-thumb">
        {site.status === "ok" && site.screenshots ? (
          <img src={`${base}${site.screenshots.hero}`} alt={`${site.name} homepage`} loading="lazy" />
        ) : (
          <div className="competitor-card-thumb-error">
            <span>Capture failed</span>
            <small>{site.error || "Unknown error"}</small>
          </div>
        )}
        {site.isOwn && <span className="badge badge--own">Your site</span>}
        {isNew && !site.isOwn && <span className="badge badge--new">Changed this week</span>}
      </div>
      <div className="competitor-card-body">
        <div className="competitor-card-name">{site.name}</div>
        <div className="competitor-card-hero">{site.heroHeading || "—"}</div>
        <div className="competitor-card-tags">
          {site.tags.length ? (
            site.tags.map((t) => <TagPill tag={t} key={t} />)
          ) : (
            <span className="competitor-card-notags">No signals detected</span>
          )}
        </div>
      </div>
    </button>
  );
}
